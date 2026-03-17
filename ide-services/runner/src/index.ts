import express from 'express';
import http from 'http';
import Docker from 'dockerode';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as os from 'os';

const app = express();
const dockerSocket = process.platform === 'win32'
  ? '//./pipe/docker_engine'
  : '/var/run/docker.sock';
const docker = new Docker({ socketPath: dockerSocket });

const CPP_RUNNER_IMAGE = process.env.CPP_RUNNER_IMAGE || 'algosphere-runner-cpp:latest';
const JAVA_RUNNER_IMAGE = process.env.JAVA_RUNNER_IMAGE || 'algosphere-runner-java:latest';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractJavaClassName = (source: string) => {
  const match = source.match(/public\s+class\s+([A-Za-z_]\w*)/);
  return match ? match[1] : 'Main';
};

const ensureImage = async (image: string) => {
  try {
    await docker.getImage(image).inspect();
  } catch {
    // Custom local runner images should be built by docker compose, not pulled.
    if (image === CPP_RUNNER_IMAGE || image === JAVA_RUNNER_IMAGE) {
      throw new Error(
        `Required local image not found: ${image}. Build it with 'docker compose build runner-cpp-image runner-java-image'.`
      );
    }
    console.log(`[runner] pulling image ${image}...`);
    await new Promise((resolve, reject) => {
      docker.pull(image, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (pullErr: any) => {
          if (pullErr) reject(pullErr); else resolve(null);
        });
      });
    });
  }
};

const TIMEOUT_MS = 15000;

/**
 * Run a command in a Docker container, passing code via base64-encoded stdin.
 * This avoids all file-system sharing issues with Docker-in-Docker.
 *
 * `shellScript` receives the decoded code on fd3 (or from /tmp/code) and runs it.
 */
async function runInDocker(opts: {
  image: string;
  /** Shell script to run inside the container. Code is available as /tmp/src */
  buildAndRunScript: string;
  /** Actual source code (will be base64-encoded and piped in) */
  sourceCode: string;
  /** User's stdin to forward to the program */
  stdin?: string;
}): Promise<{ stdout: string; stderr: string; statusCode: number }> {
  const { image, buildAndRunScript, sourceCode, stdin } = opts;

  await ensureImage(image);

  // Base64-encode source code so we can safely pass it through a shell pipe
  const b64 = Buffer.from(sourceCode).toString('base64');

  // The entrypoint: decode b64 → /tmp/src, then run the build+run script
  const entrypoint = [
    'sh', '-c',
    // First line: decode the b64 source from an env var into /tmp/src
    `echo "$SRC_B64" | base64 -d > /tmp/src && ${buildAndRunScript}`
  ];

  const container = await docker.createContainer({
    Image: image,
    Cmd: entrypoint,
    AttachStdout: true,
    AttachStderr: true,
    AttachStdin: !!stdin,
    OpenStdin: !!stdin,
    Tty: false,
    Env: [`SRC_B64=${b64}`],
    WorkingDir: '/tmp',
    HostConfig: {
      Memory: 256 * 1024 * 1024,
      NanoCpus: 500_000_000,
      NetworkMode: 'none',
      PidsLimit: 64,
      AutoRemove: true,
    },
  });

  await container.start();

  const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: !!stdin });
  let stdout = '';
  let stderr = '';

  stream.on('data', (chunk: Buffer) => {
    const type = chunk[0];
    const data = chunk.slice(8).toString('utf8');
    if (type === 1) stdout += data;
    else stderr += data;
  });

  if (stdin) {
    stream.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
    stream.end();
  }

  let timedOut = false;
  const timeoutHandle = setTimeout(async () => {
    timedOut = true;
    try { await container.stop({ t: 0 }); } catch { /* ignore */ }
  }, TIMEOUT_MS);

  const result: any = await container.wait().catch(() => ({ StatusCode: -1 }));
  clearTimeout(timeoutHandle);
  await new Promise(r => setTimeout(r, 80)); // let stream flush

  return {
    stdout,
    stderr: timedOut ? `[runner] timed out after ${TIMEOUT_MS}ms` : stderr,
    statusCode: timedOut ? -1 : (result?.StatusCode ?? 0),
  };
}

// ─── Language-specific runners ────────────────────────────────────────────────

function runCpp(code: string, stdin: string) {
  return runInDocker({
    image: CPP_RUNNER_IMAGE,
    sourceCode: code,
    // /tmp/src = the C++ source; compile and run
    buildAndRunScript: 'cp /tmp/src /tmp/main.cpp && g++ -O2 /tmp/main.cpp -o /tmp/main && /tmp/main',
    stdin,
  });
}

function runJava(code: string, stdin: string) {
  const className = extractJavaClassName(code);
  return runInDocker({
    image: JAVA_RUNNER_IMAGE,
    sourceCode: code,
    buildAndRunScript: `cp /tmp/src /tmp/${className}.java && javac /tmp/${className}.java -d /tmp && java -cp /tmp ${className}`,
    stdin,
  });
}

function runJavaScriptDocker(code: string, stdin: string) {
  return runInDocker({
    image: 'node:20-alpine',
    sourceCode: code,
    buildAndRunScript: 'node /tmp/src',
    stdin,
  });
}

/** Fast native execution for Python & JavaScript (no Docker overhead) */
const executeNative = (language: string, code: string, stdin: string): Promise<{ stdout: string; stderr: string; statusCode: number }> =>
  new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let proc: ReturnType<typeof spawn>;
    let tmpFile: string | null = null;

    const timer = setTimeout(() => {
      proc?.kill();
      resolve({ stdout, stderr: `[runner] timed out after ${TIMEOUT_MS}ms`, statusCode: -1 });
    }, TIMEOUT_MS);

    try {
      if (language === 'python') {
        proc = spawn('python', ['-u', '-c', code], { stdio: ['pipe', 'pipe', 'pipe'] });
      } else {
        // Write JS to a temp file so require() / fs.readFileSync(0) work
        tmpFile = path.join(os.tmpdir(), `js-${Date.now()}.js`);
        fs.writeFileSync(tmpFile, code);
        proc = spawn('node', [tmpFile], { stdio: ['pipe', 'pipe', 'pipe'] });
      }

      proc.stdout!.on('data', (d: Buffer) => { stdout += d.toString(); });
      proc.stderr!.on('data', (d: Buffer) => { stderr += d.toString(); });

      if (stdin) proc.stdin!.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
      proc.stdin!.end();

      proc.on('close', (code: number) => {
        clearTimeout(timer);
        if (tmpFile) { try { fs.unlinkSync(tmpFile); } catch { /* ignore */ } }
        resolve({ stdout, stderr, statusCode: code ?? 0 });
      });
      proc.on('error', (err: Error) => {
        clearTimeout(timer);
        if (tmpFile) { try { fs.unlinkSync(tmpFile); } catch { /* ignore */ } }
        resolve({ stdout, stderr: err.message, statusCode: 1 });
      });
    } catch (err: any) {
      clearTimeout(timer);
      resolve({ stdout, stderr: err.message, statusCode: 1 });
    }
  });

// ─── POST /run ────────────────────────────────────────────────────────────────

app.post('/run', async (req, res) => {
  const { language, code, stdin = '' } = req.body as { language: string; code: string; stdin?: string };

  if (!language || !code) {
    return res.status(400).json({ error: 'language and code are required', stderr: '', statusCode: 1 });
  }

  try {
    switch (language) {
      case 'cpp':
        return res.json(await runCpp(code, stdin));

      case 'java':
        return res.json(await runJava(code, stdin));

      case 'python':
      case 'javascript': {
        const r = await executeNative(language, code, stdin);
        if (!/ENOENT|not found/i.test(r.stderr)) return res.json(r);
        // Fallback to Docker if runtime not available
        console.log(`[runner] native ${language} unavailable — falling back to Docker`);
        return res.json(language === 'javascript'
          ? await runJavaScriptDocker(code, stdin)
          : await runInDocker({ image: 'python:3-slim', sourceCode: code, buildAndRunScript: 'python -u /tmp/src', stdin }));
      }

      default:
        return res.status(400).json({ error: `Unsupported language: ${language}`, stderr: `'${language}' is not supported.`, statusCode: 1 });
    }
  } catch (err: any) {
    console.error('[runner] error:', err.message);
    res.status(500).json({ error: err.message, stderr: err.message, statusCode: 1 });
  }
});

// ─── WebSocket /term ──────────────────────────────────────────────────────────

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/term' });

wss.on('connection', (ws: any) => {
  let container: any = null;
  let stream: any = null;
  let initialized = false;

  const pingInterval = setInterval(() => { try { ws.ping(); } catch { /* ignore */ } }, 10000);
  const safeSend = (payload: object) => { try { ws.send(JSON.stringify(payload)); return true; } catch { return false; } };

  ws.on('message', async (message: any) => {
    try {
      const payload = JSON.parse(message.toString());

      if (!initialized && payload.type === 'init') {
        const { language, code } = payload;
        const b64 = Buffer.from(code).toString('base64');

        let image: string;
        let buildCmd: string;

        if (language === 'cpp') {
          image = CPP_RUNNER_IMAGE;
          buildCmd = 'cp /tmp/src /tmp/main.cpp && g++ -O2 /tmp/main.cpp -o /tmp/main && /tmp/main';
        } else if (language === 'java') {
          const cls = extractJavaClassName(code);
          image = JAVA_RUNNER_IMAGE;
          buildCmd = `cp /tmp/src /tmp/${cls}.java && javac /tmp/${cls}.java -d /tmp && java -cp /tmp ${cls}`;
        } else if (language === 'javascript') {
          image = 'node:20-alpine';
          buildCmd = 'node /tmp/src';
        } else {
          image = 'python:3-slim';
          buildCmd = 'python -u /tmp/src';
        }

        try {
          await ensureImage(image);
          container = await docker.createContainer({
            Image: image,
            Cmd: ['sh', '-c', `echo "$SRC_B64" | base64 -d > /tmp/src && ${buildCmd}`],
            Env: [`SRC_B64=${b64}`],
            WorkingDir: '/tmp',
            AttachStdout: true,
            AttachStderr: true,
            AttachStdin: true,
            OpenStdin: true,
            Tty: true,
            HostConfig: { Memory: 128 * 1024 * 1024, CpuPeriod: 100000, CpuQuota: 50000, NetworkMode: 'none', AutoRemove: true },
          });

          await container.start();
          stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
          stream.on('data', (chunk: Buffer) => { safeSend({ type: 'output', data: chunk.toString('utf8') }); });

          container.wait({ timeout: TIMEOUT_MS }).then((r: any) => {
            setTimeout(() => { safeSend({ type: 'exit', code: r.StatusCode }); try { ws.close(); } catch { /* ignore */ } }, 100);
          }).catch((err: any) => {
            safeSend({ type: 'output', data: `[runner] error: ${err?.message}\n` });
            safeSend({ type: 'exit', code: -1 });
          });

          initialized = true;
          safeSend({ type: 'output', data: '[runner] started\n' });
        } catch (err: any) {
          safeSend({ type: 'output', data: `[runner] init error: ${err?.message}\n` });
          safeSend({ type: 'exit', code: -1 });
          ws.close();
        }
        return;
      }

      if (initialized && payload.type === 'input' && stream) {
        safeSend({ type: 'output', data: payload.data });
        stream.write(payload.data);
      }
    } catch (err: any) {
      console.error('[ws] error:', err.message);
    }
  });

  ws.on('close', async () => {
    clearInterval(pingInterval);
    try { if (stream) stream.end(); } catch { /* ignore */ }
    try { if (container) await container.stop({ t: 0 }); } catch { /* ignore */ }
  });
});

server.listen(4002, () => console.log('[runner] listening on port 4002 (HTTP + WS)'));

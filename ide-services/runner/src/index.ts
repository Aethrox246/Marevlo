import express from 'express';
import http from 'http';
import Docker from 'dockerode';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { PassThrough } from 'stream';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as os from 'os';

const app = express();
const docker = new Docker({
  socketPath: '/var/run/docker.sock'
});

app.use(cors());
app.use(express.json());

const escapeForShell = (value: string) => value.replace(/'/g, "'\\''");
const extractJavaClassName = (source: string) => {
  const match = source.match(/public\s+class\s+([A-Za-z_]\w*)/);
  return match ? match[1] : 'Main';
};

const ensureImage = async (dockerClient: any, image: string) => {
  try {
    await dockerClient.getImage(image).inspect();
  } catch {
    await new Promise((resolve, reject) => {
      dockerClient.pull(image, (err: any, stream: any) => {
        if (err) return reject(err);
        dockerClient.modem.followProgress(stream, (pullErr: any) => {
          if (pullErr) reject(pullErr);
          else resolve(null);
        });
      });
    });
  }
};

async function runCpp(code: string) {

  const id = Date.now().toString()

  const tempDir = path.join(os.tmpdir(), `cpp-${id}`)

  fs.mkdirSync(tempDir, { recursive: true })

  const filePath = path.join(tempDir, "main.cpp")

  fs.writeFileSync(filePath, code)

  const container = await docker.createContainer({

    Image: "marevlo-cpp-runner",

    Cmd: ["sh","-c","g++ main.cpp -o main && ./main"],

    WorkingDir: "/sandbox",

    AttachStdout: true,
    AttachStderr: true,

    HostConfig: {

      Binds: [`${tempDir}:/sandbox`],

      Memory: 256 * 1024 * 1024,

      NanoCpus: 500000000,

      NetworkMode: "none",

      PidsLimit: 64,

      AutoRemove: true

    }

  })

  await container.start()

  const stream = await container.attach({
    stream: true,
    stdout: true,
    stderr: true
  })

  let stdout = ""
  let stderr = ""

  stream.on("data",(chunk:Buffer)=>{
    const output = chunk.toString("utf8").slice(8)
    if(chunk[0] === 1) stdout += output
    else stderr += output
  })

  let timedOut = false

  const timeout = setTimeout(async ()=>{
    timedOut = true
    try { await container.stop({t:0}) } catch {}
  },10000)

  const result:any = await container.wait()

  clearTimeout(timeout)

  fs.rmSync(tempDir,{recursive:true,force:true})

  if(timedOut){
    return "[runner] execution timed out"
  }

  return stdout || stderr || ""
}

// Native execution (without Docker) for Python and JavaScript
const executeNative = async (language: string, code: string, stdin: string, timeoutMs: number = 60000): Promise<{ stdout: string; stderr: string; statusCode: number }> => {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let process: any;

    const timeoutId = setTimeout(() => {
      process?.kill();
      resolve({
        stdout,
        stderr: `[runner] timed out after ${timeoutMs}ms`,
        statusCode: -1
      });
    }, timeoutMs);

    try {
      if (language === 'python') {
        process = spawn('python', ['-u', '-c', code], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } else if (language === 'javascript') {
        process = spawn('node', ['-e', code], {
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } else {
        clearTimeout(timeoutId);
        return resolve({
          stdout: '',
          stderr: `Language ${language} requires Docker`,
          statusCode: 1
        });
      }

      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      if (stdin) {
        process.stdin.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
      }
      process.stdin.end();

      process.on('close', (code: number) => {
        clearTimeout(timeoutId);
        resolve({
          stdout,
          stderr,
          statusCode: code ?? 0
        });
      });

      process.on('error', (err: any) => {
        clearTimeout(timeoutId);
        resolve({
          stdout,
          stderr: err.message,
          statusCode: 1
        });
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr: err.message,
        statusCode: 1
      });
    }
  });
};

app.post('/run', async (req, res) => {
  const { language, code, stdin = '' } = req.body;
  const timeoutMs = 10000; // 10 seconds max - much faster!

  try {
    switch (language) {
      case 'cpp': {
        const output = await runCpp(code);
        return res.json({ stdout: output, stderr: '', statusCode: 0 });
      }
      default:
        break;
    }

    // PRIORITY: Use native execution first (much faster - no Docker overhead)
    if (language === 'python' || language === 'javascript') {
      const result = await executeNative(language, code, stdin, timeoutMs);
      const notFound = /ENOENT|not found/i.test(result.stderr || '');
      if (!notFound) {
        return res.json(result);
      }
      // If runtime isn't available in the container, fall back to Docker below.
    }

    // For C++ and Java, try Docker if available
    let dockerAvailable = false;
    try {
      await docker.ping();
      dockerAvailable = true;
    } catch {
      dockerAvailable = false;
    }

    if (!dockerAvailable) {
      return res.status(503).json({ 
        error: `${language} requires Docker which is not available`,
        stderr: `Docker is not running. ${language} execution not supported.`,
        statusCode: 1
      });
    }

    // Docker path for C++ and Java
    let image = 'python:3-alpine';
    let cmd = ['python', '-u', '-c', code];

    if (language === 'cpp') {
      image = 'gcc:latest';
      cmd = ['sh', '-c', `echo '${escapeForShell(code)}' > main.cpp && g++ main.cpp -o main && ./main`];
    } else if (language === 'java') {
      const className = extractJavaClassName(code);
      image = 'eclipse-temurin:17-jdk';
      cmd = ['sh', '-c', `echo '${escapeForShell(code)}' > ${className}.java && javac ${className}.java && java ${className}`];
    }

    await ensureImage(docker, image);
    const container = await docker.createContainer({
      Image: image,
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: true,
      OpenStdin: true,
      Tty: false,
      WorkingDir: '/tmp',
      HostConfig: {
        Memory: 128 * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: 50000,
        AutoRemove: true
      }
    });

    await container.start();

    const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
    let stdout = '';
    let stderr = '';

    stream.on('data', (chunk: Buffer) => {
      const output = chunk.toString('utf8').slice(8);
      if (chunk[0] === 1) stdout += output;
      else stderr += output;
    });

    if (stdin && typeof stdin === 'string') {
      stream.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
    }
    stream.end();

    let timedOut = false;
    const waitPromise = container.wait().catch((err: any) => ({ StatusCode: -1, error: err }));
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        timedOut = true;
        resolve(null);
      }, timeoutMs);
    });

    const result: any = await Promise.race([waitPromise, timeoutPromise]);

    if (timedOut) {
      try {
        await container.stop({ t: 0 });
      } catch {
        // ignore stop errors
      }
      if (!stderr) {
        stderr = `[runner] timed out after ${timeoutMs}ms`;
      }
      return res.status(408).json({ stdout, stderr, error: stderr });
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    return res.json({ stdout, stderr, statusCode: result?.StatusCode ?? 0 });

  } catch (err: any) {
    res.status(500).json({ 
      error: err.message,
      stderr: err.message,
      statusCode: 1
    });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/term' });

const buildCommand = (language: string, code: string) => {
  let image = 'python:3-alpine';
  let cmd = ['python', '-u', '-c', code];

  if (language === 'cpp') {
    image = 'gcc:latest';
    cmd = ['sh', '-c', `echo '${escapeForShell(code)}' > main.cpp && g++ main.cpp -o main && ./main`];
  } else if (language === 'java') {
    const className = extractJavaClassName(code);
    image = 'eclipse-temurin:17-jdk';
    cmd = ['sh', '-c', `echo '${escapeForShell(code)}' > ${className}.java && javac ${className}.java && java ${className}`];
  } else if (language === 'javascript') {
    image = 'node:18-alpine';
    cmd = ['sh', '-c', `echo '${escapeForShell(code)}' > main.js && node main.js`];
  } else if (language === 'python') {
    image = 'python:3-alpine';
    cmd = ['python', '-u', '-c', code];
  }

  return { image, cmd };
};

wss.on('connection', (ws: any) => {
  let container: any = null;
  let stream: any = null;
  let initialized = false;
  console.log('WS client connected');
  const pingInterval = setInterval(() => {
    try {
      ws.ping();
    } catch {
      // ignore ping errors
    }
  }, 10000);
  const safeSend = (payload: any) => {
    try {
      ws.send(JSON.stringify(payload), { binary: false });
      return true;
    } catch (err) {
      console.error('WS send error:', err);
      return false;
    }
  };

  ws.on('message', async (message: any) => {
    try {
      const text = message.toString();
      console.log('WS message:', text.slice(0, 200));
      const payload = JSON.parse(text);
      if (!initialized && payload.type === 'init') {
        try {
          const { language, code } = payload;
          const { image, cmd } = buildCommand(language, code);

          await ensureImage(docker, image);
          container = await docker.createContainer({
            Image: image,
            Cmd: cmd,
            AttachStdout: true,
            AttachStderr: true,
            AttachStdin: true,
            OpenStdin: true,
            Tty: true,
            WorkingDir: '/tmp',
            HostConfig: {
              Memory: 128 * 1024 * 1024,
              CpuPeriod: 100000,
              CpuQuota: 50000,
              AutoRemove: true
            }
          });

          await container.start();
          stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
          stream.on('data', (chunk: Buffer) => {
            safeSend({ type: 'output', data: chunk.toString('utf8') });
          });

          container.wait({ timeout: 10000 }).then((result: any) => {
            setTimeout(() => {
              safeSend({ type: 'exit', code: result.StatusCode });
              // fallback: if nothing came through, send container logs
              container.logs({ stdout: true, stderr: true }).then((logs: any) => {
                const logText = logs?.toString('utf8') || '';
                if (logText.trim().length > 0) {
                  safeSend({ type: 'output', data: logText });
                }
              }).catch(() => {});
              setTimeout(() => {
                try {
                  ws.close();
                } catch {
                  // ignore close errors
                }
              }, 100);
            }, 100);
          }).catch((err: any) => {
            safeSend({ type: 'output', data: `[runner] wait error: ${err?.message || err}\n` });
            safeSend({ type: 'exit', code: -1 });
            try {
              ws.close();
            } catch {
            // ignore close errors
          }
        });

          initialized = true;
          ws.send(JSON.stringify({ type: 'output', data: '[runner] started\n' }));
          return;
        } catch (err: any) {
          console.error('WS init error:', err);
          ws.send(JSON.stringify({ type: 'output', data: `[runner] init error: ${err?.message || err}\n` }));
          ws.send(JSON.stringify({ type: 'exit', code: -1 }));
          ws.close();
        }
      }

      if (initialized && payload.type === 'input' && stream) {
        // Echo the input back to the frontend so user can see what they typed
        safeSend({ type: 'output', data: payload.data });
        // Send the input to the container
        stream.write(payload.data);
      }
    } catch (err: any) {
      console.error('WS message error:', err);
      try {
        ws.send(JSON.stringify({ type: 'output', data: `[runner] message error: ${err?.message || err}\n` }));
      } catch {
        // ignore send errors
      }
    }
  });

  ws.on('close', async () => {
    console.log('WS client disconnected');
    clearInterval(pingInterval);
    try {
      if (stream) stream.end();
      if (container) {
        await container.stop({ t: 0 });
      }
    } catch {
      // ignore cleanup errors
    }
  });
});

server.listen(4002, () => console.log('Runner on 4002 (HTTP + WS)'));

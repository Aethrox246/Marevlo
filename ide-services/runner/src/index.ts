import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as os from 'os';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const TIMEOUT_MS = 15000;

// Extract the Java class name so we know what file to compile
const extractJavaClassName = (source: string) => {
  const match = source.match(/public\s+class\s+([A-Za-z_]\w*)/);
  return match ? match[1] : 'Main';
};

// ─── Native code execution ─────────────────────────────────────────────────────

/**
 * Run a command natively using child_process.spawn.
 * Writes source code to a temp file, compiles/runs it, then cleans up.
 */
const executeNative = (
  language: string,
  code: string,
  stdin: string
): Promise<{ stdout: string; stderr: string; statusCode: number }> =>
  new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let proc: ReturnType<typeof spawn>;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-'));
    const cleanup = () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    };

    const timer = setTimeout(() => {
      proc?.kill();
      cleanup();
      resolve({ stdout, stderr: `[runner] timed out after ${TIMEOUT_MS}ms`, statusCode: -1 });
    }, TIMEOUT_MS);

    const finish = (code: number) => {
      clearTimeout(timer);
      cleanup();
      resolve({ stdout, stderr, statusCode: code ?? 0 });
    };

    try {
      if (language === 'python') {
        const srcFile = path.join(tmpDir, 'main.py');
        fs.writeFileSync(srcFile, code);
        proc = spawn('python3', [srcFile], { stdio: ['pipe', 'pipe', 'pipe'] });

      } else if (language === 'javascript') {
        const srcFile = path.join(tmpDir, 'main.js');
        fs.writeFileSync(srcFile, code);
        proc = spawn('node', [srcFile], { stdio: ['pipe', 'pipe', 'pipe'] });

      } else if (language === 'cpp') {
        const srcFile = path.join(tmpDir, 'main.cpp');
        const binFile = path.join(tmpDir, 'main');
        fs.writeFileSync(srcFile, code);

        // Compile first
        const compiler = spawn('g++', ['-O2', srcFile, '-o', binFile], { stdio: ['pipe', 'pipe', 'pipe'] });
        let compileErr = '';
        compiler.stderr.on('data', (d: Buffer) => { compileErr += d.toString(); });
        compiler.on('close', (exitCode: number) => {
          if (exitCode !== 0) {
            clearTimeout(timer);
            cleanup();
            return resolve({ stdout: '', stderr: compileErr, statusCode: exitCode });
          }
          // Run compiled binary
          proc = spawn(binFile, [], { stdio: ['pipe', 'pipe', 'pipe'] });
          proc.stdout!.on('data', (d: Buffer) => { stdout += d.toString(); });
          proc.stderr!.on('data', (d: Buffer) => { stderr += d.toString(); });
          if (stdin) proc.stdin!.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
          proc.stdin!.end();
          proc.on('close', finish);
          proc.on('error', (err: Error) => { clearTimeout(timer); cleanup(); resolve({ stdout, stderr: err.message, statusCode: 1 }); });
        });
        return; // async compile step handles continuation

      } else if (language === 'java') {
        const className = extractJavaClassName(code);
        const srcFile = path.join(tmpDir, `${className}.java`);
        fs.writeFileSync(srcFile, code);

        // Compile first
        const compiler = spawn('javac', [srcFile, '-d', tmpDir], { stdio: ['pipe', 'pipe', 'pipe'] });
        let compileErr = '';
        compiler.stderr.on('data', (d: Buffer) => { compileErr += d.toString(); });
        compiler.on('close', (exitCode: number) => {
          if (exitCode !== 0) {
            clearTimeout(timer);
            cleanup();
            return resolve({ stdout: '', stderr: compileErr, statusCode: exitCode });
          }
          proc = spawn('java', ['-cp', tmpDir, className], { stdio: ['pipe', 'pipe', 'pipe'] });
          proc.stdout!.on('data', (d: Buffer) => { stdout += d.toString(); });
          proc.stderr!.on('data', (d: Buffer) => { stderr += d.toString(); });
          if (stdin) proc.stdin!.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
          proc.stdin!.end();
          proc.on('close', finish);
          proc.on('error', (err: Error) => { clearTimeout(timer); cleanup(); resolve({ stdout, stderr: err.message, statusCode: 1 }); });
        });
        return; // async compile step handles continuation

      } else {
        clearTimeout(timer);
        cleanup();
        return resolve({ stdout: '', stderr: `Unsupported language: ${language}`, statusCode: 1 });
      }

      proc!.stdout!.on('data', (d: Buffer) => { stdout += d.toString(); });
      proc!.stderr!.on('data', (d: Buffer) => { stderr += d.toString(); });
      if (stdin) proc!.stdin!.write(stdin.endsWith('\n') ? stdin : `${stdin}\n`);
      proc!.stdin!.end();
      proc!.on('close', finish);
      proc!.on('error', (err: Error) => { clearTimeout(timer); cleanup(); resolve({ stdout, stderr: err.message, statusCode: 1 }); });

    } catch (err: any) {
      clearTimeout(timer);
      cleanup();
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
    const result = await executeNative(language, code, stdin);
    return res.json(result);
  } catch (err: any) {
    console.error('[runner] error:', err.message);
    res.status(500).json({ error: err.message, stderr: err.message, statusCode: 1 });
  }
});

// ─── WebSocket /term ──────────────────────────────────────────────────────────

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/term' });

wss.on('connection', (ws: any) => {
  let proc: ReturnType<typeof spawn> | null = null;
  let initialized = false;
  let tmpDir: string | null = null;

  const pingInterval = setInterval(() => { try { ws.ping(); } catch { /* ignore */ } }, 10000);
  const safeSend = (payload: object) => { try { ws.send(JSON.stringify(payload)); return true; } catch { return false; } };
  const cleanup = () => {
    if (tmpDir) { try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ } }
    tmpDir = null;
  };

  ws.on('message', async (message: any) => {
    try {
      const payload = JSON.parse(message.toString());

      if (!initialized && payload.type === 'init') {
        const { language, code } = payload;
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-term-'));
        initialized = true;

        const launchInteractive = (cmd: string, args: string[]) => {
          proc = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
          proc.stdout!.on('data', (chunk: Buffer) => { safeSend({ type: 'output', data: chunk.toString('utf8') }); });
          proc.stderr!.on('data', (chunk: Buffer) => { safeSend({ type: 'output', data: chunk.toString('utf8') }); });
          proc.on('close', (code: number) => {
            setTimeout(() => {
              safeSend({ type: 'exit', code: code ?? 0 });
              try { ws.close(); } catch { /* ignore */ }
              cleanup();
            }, 100);
          });
          safeSend({ type: 'output', data: '[runner] started\n' });
        };

        if (language === 'python') {
          const srcFile = path.join(tmpDir!, 'main.py');
          fs.writeFileSync(srcFile, code);
          launchInteractive('python3', ['-u', srcFile]);

        } else if (language === 'javascript') {
          const srcFile = path.join(tmpDir!, 'main.js');
          fs.writeFileSync(srcFile, code);
          launchInteractive('node', [srcFile]);

        } else if (language === 'cpp') {
          const srcFile = path.join(tmpDir!, 'main.cpp');
          const binFile = path.join(tmpDir!, 'main');
          fs.writeFileSync(srcFile, code);
          const compiler = spawn('g++', ['-O2', srcFile, '-o', binFile], { stdio: ['pipe', 'pipe', 'pipe'] });
          let compileErr = '';
          compiler.stderr.on('data', (d: Buffer) => { compileErr += d.toString(); });
          compiler.on('close', (exitCode: number) => {
            if (exitCode !== 0) {
              safeSend({ type: 'output', data: `[compile error]\n${compileErr}` });
              safeSend({ type: 'exit', code: exitCode }); ws.close(); cleanup(); return;
            }
            launchInteractive(binFile, []);
          });

        } else if (language === 'java') {
          const className = extractJavaClassName(code);
          const srcFile = path.join(tmpDir!, `${className}.java`);
          fs.writeFileSync(srcFile, code);
          const compiler = spawn('javac', [srcFile, '-d', tmpDir!], { stdio: ['pipe', 'pipe', 'pipe'] });
          let compileErr = '';
          compiler.stderr.on('data', (d: Buffer) => { compileErr += d.toString(); });
          compiler.on('close', (exitCode: number) => {
            if (exitCode !== 0) {
              safeSend({ type: 'output', data: `[compile error]\n${compileErr}` });
              safeSend({ type: 'exit', code: exitCode }); ws.close(); cleanup(); return;
            }
            launchInteractive('java', ['-cp', tmpDir!, className]);
          });
        }

        return;
      }

      if (initialized && payload.type === 'input' && proc) {
        safeSend({ type: 'output', data: payload.data });
        proc.stdin!.write(payload.data);
      }
    } catch (err: any) {
      console.error('[ws] error:', err.message);
    }
  });

  ws.on('close', () => {
    clearInterval(pingInterval);
    try { if (proc) proc.kill(); } catch { /* ignore */ }
    cleanup();
  });
});

const PORT = parseInt(process.env.PORT || '4002', 10);
server.listen(PORT, () => console.log(`[runner] listening on port ${PORT} (HTTP + WS)`));

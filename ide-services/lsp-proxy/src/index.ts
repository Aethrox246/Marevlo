import { WebSocketServer } from "ws";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";

const PORT = 4001;

// Create websocket proxy server
const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`LSP Proxy running on port ${PORT}`);
});

wss.on("connection", (client, req) => {
  console.log("LSP client connected");

  const url = req.url || "";
  const language = url.replace("/lsp/", "");

  let serverCmd = "";
  let serverArgs: string[] = [];

  if (language === "python") {
    serverCmd = "pyright-langserver";
    serverArgs = ["--stdio"];
  } else if (language === "cpp") {
    serverCmd = "clangd";
    serverArgs = ["--stdio"];
  } else {
    console.log("❌ Unsupported language:", language);
    client.close();
    return;
  }

  // Launch language server
  const ls: ChildProcessWithoutNullStreams = spawn(serverCmd, serverArgs);

  // Forward LS → Client
  ls.stdout.on("data", (msg) => client.send(msg));
  ls.stderr.on("data", (err) => console.error("[LS Error]", err.toString()));

  // Forward Client → LS
  client.on("message", (msg) => ls.stdin.write(msg));

  // Cleanup
  client.on("close", () => {
    console.log("Client disconnected, killing LS");
    ls.kill();
  });
});

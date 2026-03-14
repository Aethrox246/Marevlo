import express from "express";
import cors from "cors";
import crypto from "crypto";
import WebSocket from "ws";
const fetch = global.fetch;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// Use Docker service name inside compose network; allow override via env var.
const JUPYTER = process.env.JUPYTER_URL || "http://jupyter:8888";

app.get("/", (req, res) => {
  res.send("API Server running 🧠");
});

app.post("/api/nb/execute", async (req, res) => {
  try {
    const { code } = req.body;

    // 1️⃣ Create a kernel
    const kernelRes = await fetch(`${JUPYTER}/api/kernels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!kernelRes.ok) {
      const body = await kernelRes.text();
      throw new Error(`Jupyter kernel create failed: ${kernelRes.status} ${kernelRes.statusText} - ${body.slice(0, 500)}`);
    }
    const kernelText = await kernelRes.text();
    let kernel;
    try {
      kernel = JSON.parse(kernelText);
    } catch {
      throw new Error(`Jupyter kernel create returned non-JSON: ${kernelText.slice(0, 500)}`);
    }

    // 2️⃣ Execute code via Jupyter WebSocket channels API
    const baseUrl = new URL(JUPYTER);
    baseUrl.protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
    baseUrl.pathname = `/api/kernels/${kernel.id}/channels`;
    const sessionId = crypto.randomUUID();
    baseUrl.searchParams.set("session_id", sessionId);
    const wsUrl = baseUrl.toString();

    const msgId = crypto.randomUUID();
    const executeRequest = {
      header: {
        msg_id: msgId,
        username: "api",
        session: sessionId,
        msg_type: "execute_request",
        version: "5.3"
      },
      parent_header: {},
      metadata: {},
      content: {
        code,
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: false,
        stop_on_error: true
      }
    };

    const outputs: string[] = [];
    const errors: string[] = [];

    const result = await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timeoutId = setTimeout(() => {
        try { ws.close(); } catch {}
        reject(new Error("Jupyter execution timed out"));
      }, 10000);

      ws.onopen = () => {
        ws.send(JSON.stringify(executeRequest));
      };

      ws.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error("Jupyter WebSocket error"));
      };

      ws.onmessage = (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data.toString());
        } catch {
          return;
        }

        const parentId = msg?.parent_header?.msg_id;
        if (parentId !== msgId) return;

        const msgType = msg?.header?.msg_type;
        if (msgType === "stream") {
          outputs.push(msg?.content?.text || "");
        } else if (msgType === "execute_result" || msgType === "display_data") {
          const data = msg?.content?.data || {};
          outputs.push(data["text/plain"] || "");
        } else if (msgType === "error") {
          const tb = (msg?.content?.traceback || []).join("\n");
          errors.push(`${msg?.content?.ename || "Error"}: ${msg?.content?.evalue || ""}\n${tb}`);
        } else if (msgType === "status" && msg?.content?.execution_state === "idle") {
          clearTimeout(timeoutId);
          try { ws.close(); } catch {}
          resolve({ outputs, errors });
        }
      };
    });

    // Best-effort cleanup of the kernel
    fetch(`${JUPYTER}/api/kernels/${kernel.id}`, { method: "DELETE" }).catch(() => {});

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error:String(err) });
  }
});

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));

import { serve } from "https://deno.land/std/http/server.ts";
import { acceptable, acceptWebSocket } from "https://deno.land/std/ws/mod.ts";

const clients = new Map<string, WebSocket>();

const server = serve({ port: 8000 });

console.log("Listening on http://localhost:8000");

for await (const req of server) {
  if (req.method === "GET" && req.url === "/ws" && acceptable(req)) {
    acceptWebSocket({
      conn: req.conn,
      bufReader: req.r,
      bufWriter: req.w,
      headers: req.headers,
    }).then(handleWebSocket);
  } else {
    req.respond({ status: 404, body: "Not found" });
  }
}

function handleWebSocket(ws: WebSocket) {
  console.log("Socket connected");

  ws.onopen = () => console.log("Socket opened");

  ws.onmessage = (message: MessageEvent) => {
    const wsPayload: { type: string, data: string, mentions?: string[] } = JSON.parse(message.data.toString());

    if (wsPayload.type === "join") {
      clients.set(wsPayload.data, ws);
      clients.forEach(client => client.send(JSON.stringify({ type: "message", data: `${wsPayload.data} Joined` })));
    }

    if (wsPayload?.mentions && Array.isArray(wsPayload.mentions)) {
      wsPayload.mentions.forEach(mention => {
        const client = clients.get(mention);
        if (client) {
          client.send(JSON.stringify({ type: "message", data: wsPayload.data }));
        }
      });
    }
  };

  ws.onclose = () => {
    clients.forEach((client, key) => {
      if (client === ws) {
        clients.delete(key);
        clients.forEach(c => c.send(JSON.stringify({ type: "message", data: `${key} Left` })));
      }
    });
  };
}

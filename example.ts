import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

serve((req: Request) => {
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() != "websocket") {
    return new Response("request isn't trying to upgrade to websocket.");
  }
  const { response } = Deno.upgradeWebSocket(req);

const clients = new Map<string, WebSocketClient>();
const wss = new WebSocketServer();

wss.on("connection", function (ws: WebSocketClient) {
  ws.on("message", function (message: string) {
    const wsPayload: { type: string, data: string, mentions?: string[] } = JSON.parse(message);
    
    if (wsPayload.type === "join") {
      clients.set(wsPayload.data, ws);
      clients.forEach(client => client.send(JSON.stringify({ type: "message", data: `${wsPayload.data} Joined` })))
    }

    if(wsPayload?.mentions && Array.isArray(wsPayload.mentions)) {
      wsPayload.mentions.forEach(mention => {
        if (clients.has(mention)) {
          clients.get(mention)?.send(JSON.stringify({ type: "message", data: wsPayload.data }));
        }
      })
    }
  });

  ws.on("close", function () {
    clients.forEach((client, key) => {
      if (client === ws) {
        clients.delete(key);
        clients.forEach(c => c.send(JSON.stringify({ type: "message", data: `${key} Left` })));
      }
    });
  });
});

  return response;
});

console.log("Listening on http://localhost:8000");
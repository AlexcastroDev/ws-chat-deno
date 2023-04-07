import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

const clients = new Map<string, WebSocketClient>();
const wss = new WebSocketServer(8080);

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

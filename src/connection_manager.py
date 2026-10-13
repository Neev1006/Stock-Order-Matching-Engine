import json

from fastapi import WebSocket , WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections : list[WebSocket] = []

    async def connect(self , websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def disconnect(self , websocket : WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self , msg : dict):
        active = self.active_connections.copy()
        for w in active:
            try:
                await w.send_json(msg)

            except WebSocketDisconnect:
               await self.disconnect(w)
        
from fastapi import WebSocket

class ConnectionManager:

    def __init__(self):
        self.active_connections : list[WebSocket] = []

    async def connect(self, websocket : WebSocket):

        await websocket.accept()
        self.active_connections.append(websocket)
        print("🟢 New Dashboard connected!")    

    def disconnect(self,websocket : WebSocket):
        self.active_connections.remove(websocket)
        print("🔴 Dashboard disconnected!")
    
    async def broadcast(self, message : dict):

        dead_connection = []

        for connection in self.active_connections:
            try : 
                await connection.send_json(message)
            except Exception:
                dead_connection.append(connection)
        
        for connection in dead_connection:
            self.disconnect(connection)            

manager = ConnectionManager()
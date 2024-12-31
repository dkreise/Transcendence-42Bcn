from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .gameManager import GameManager
import logging
import uuid
import asyncio

logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room']
        
        # Generate a unique player ID for this connection
        query_string = parse_qs(self.scope['query_string'].decode())
        self.player_id = query_string.get('player_id', [str(uuid.uuid4())])[0]
        
        # Role assignment logic using player_id
        self.role = GameManager.joinRoom(self.room_id, self.player_id)
        if not self.role:
            await self.close()
            return

        # Add to channel group
        await self.channel_layer.group_add(self.room_id, self.channel_name)
        await self.accept()

        # Send the player's role back to them
        await self.send(json.dumps({"type": "role", "role": self.role, "player_id": self.player_id}))
        self.game_loop_task = asyncio.create_task(self.game_loop())


    async def disconnect(self, close_code):
        GameManager.leaveRoom(self.room_id, self.player_id)
        #GameManager.leaveRoom(self.room_id, self.scope['user'])
        await self.channel_layer.group_discard(self.room_id, self.channel_name)
        #self.game_loop_task.cancel()

    async def receive(self, text_data):
        data = json.loads(text_data)
        response = GameManager.handleMessage(self.room_id, self.role, data)
        #response = GameManager.handleMessage(self.room_id, self.scope['user'], data)

        # Broadcast the game state to all players
        if response:
            await self.channel_layer.group_send(
                self.room_id,
                {"type": "broadcast", "message": response}
            )

    async def broadcast(self, event):
        await self.send(json.dumps(event["message"]))

    async def game_loop(self):
        while True:
            # Update ball position
            GameManager.updateBallPos(GameManager.games[self.room_id])
            
            await self.channel_layer.group_send(
                self.room_id,
                {
                    "type": "game_update",
                    "game_state": GameManager.games[self.room_id],
                },
            )
            

            # Adjust the loop speed (e.g., 60 FPS = ~16ms per frame)
            await asyncio.sleep(1 / 60)
    async def game_update(self, event):
        # Send the game state to the WebSocket client
        await self.send(json.dumps({
            "type": "update",
            "ball": event["game_state"]["ball"],
            "scores": event["game_state"]["scores"],
            "players": {
                role: {
                    "y": player["y"]
                }
                for role, player in event["game_state"]["players"].items()
            },
        }))
    

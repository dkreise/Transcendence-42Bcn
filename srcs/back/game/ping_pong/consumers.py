from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid
from .game_manager import GameManager

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room']
        self.player_id = str(uuid.uuid4())
        
        self.role = GameManager.join_room(self.room_id, self.player_id)
        if not self.role:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_id, self.channel_name)
        await self.accept()

        await self.send(json.dumps({"type": "role", "role": self.role}))

    async def disconnect(self, close_code):
        GameManager.leave_room(self.room_id, self.player_id)
        await self.channel_layer.group_discard(self.room_id, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        response = GameManager.handle_message(self.room_id, self.player_id, data)

        # Broadcast the game state to all players
        if response:
            await self.channel_layer.group_send(
                self.room_id,
                {"type": "broadcast", "message": response}
            )

    async def broadcast(self, event):
        await self.send(json.dumps(event["message"]))

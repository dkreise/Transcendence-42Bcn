from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid
from .game_manager import GameManager

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(f"Attempting connection: {self.scope['url_route']['kwargs']}")
        self.room_id = self.scope['url_route']['kwargs']['room']  # Get room from URL
        #self.player_id = self.scope['session'].session_key or self.scope['client'][0]  # Unique identifier (session or IP)
        self.player_id = str(uuid.uuid4()) # Generate a unique identifier for this connection
        print(f"Player ID: {self.player_id}")

        self.role = GameManager.join_room(self.room_id, self.player_id)
        if not self.role:
            print(f"Connection rejected: room full or invalid")
            await self.close()  # Reject connection if room is full or player unauthorized
            return

        await self.channel_layer.group_add(self.room_id, self.channel_name)
        await self.accept()

        # Notify client of their role
        print(f"Connection accepted: {self.role}")
        await self.send(json.dumps({"type": "role", "role": self.role}))

    async def disconnect(self, close_code):
        GameManager.leave_room(self.room_id, self.player_id)
        await self.channel_layer.group_discard(self.room_id, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        GameManager.handle_message(self.room_id, data)

        # Broadcast to room
        await self.channel_layer.group_send(
            self.room_id,
            {"type": "broadcast", "message": data}
        )

    async def broadcast(self, event):
        await self.send(json.dumps(event["message"]))

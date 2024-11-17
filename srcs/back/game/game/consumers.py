#from channels.generic.websocket import AsyncWebsocketConsumer
#import json
#
#class PongConsumer(AsyncWebsocketConsumer):
#    async def connect(self):
#        self.room_name = "ping_pong_room"
#        self.room_group_name = f"game_{self.room_name}"
#        await self.channel_layer.group_add(
#            self.room_group_name,
#            self.channel_name
#        )
#        await self.accept()
#
#    async def disconnect(self, close_code):
#        await self.channel_layer.group_discard(
#            self.room_group_name,
#            self.channel_name
#        )
#
#    async def receive(self, text_data):
#        data = json.loads(text_data)
#        # Relay the message to the other player
#        await self.channel_layer.group_send(
#            self.room_group_name,
#            {
#                "type": "paddle.move",
#                "message": data
#            }
#        )
#
#    async def paddle_move(self, event):
#        message = event["message"]
#        await self.send(text_data=json.dumps(message))


from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Parse the session ID from the WebSocket URL query string
        query_params = parse_qs(self.scope["query_string"].decode())
        self.session_id = query_params.get("session", ["default"])[0]  # Default session if none provided
        self.room_group_name = f"game_{self.session_id}"

        # Add the connection to the group for this session
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Remove the connection from the group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Relay the message to all clients in the same session
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "paddle.move",
                "message": data
            }
        )

    async def paddle_move(self, event):
        # Send the paddle movement data to the client
        message = event["message"]
        await self.send(text_data=json.dumps(message))

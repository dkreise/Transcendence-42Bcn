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
    #async def connect(self):
    #    # Parse the session ID from the WebSocket URL query string
    #    query_params = parse_qs(self.scope["query_string"].decode())
    #    self.session_id = query_params.get("session", ["default"])[0]  # Default session if none provided
    #    self.room_group_name = f"game_{self.session_id}"
#
    #    # Add the connection to the group for this session
    #    await self.channel_layer.group_add(
    #        self.room_group_name,
    #        self.channel_name
    #    )
    #    await self.accept()
#
    #async def disconnect(self, close_code):
    #    # Remove the connection from the group
    #    await self.channel_layer.group_discard(
    #        self.room_group_name,
    #        self.channel_name
    #    )

    async def connect(self):
        # Parse the room and session info
        query_params = parse_qs(self.scope["query_string"].decode())
        self.session_id = query_params.get("room", ["default"])[0]
        self.room_group_name = f"game_{self.session_id}"

        # Track players in the room (a naive approach for simplicity)
        if not hasattr(self.channel_layer, "rooms"):
            self.channel_layer.rooms = {}
        if self.room_group_name not in self.channel_layer.rooms:
            self.channel_layer.rooms[self.room_group_name] = []

        player_count = len(self.channel_layer.rooms[self.room_group_name])
        if player_count >= 2:
            # Reject connection if room is full
            await self.close()
            return

        # Assign player roles
        self.player_role = "player1" if player_count == 0 else "player2"
        self.channel_layer.rooms[self.room_group_name].append(self.player_role)

        # Add to the group and accept the WebSocket connection
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Send role to the client
        await self.send(text_data=json.dumps({"type": "role", "role": self.player_role}))

    async def disconnect(self, close_code):
        # Remove from the group and room tracking
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if self.room_group_name in self.channel_layer.rooms:
            self.channel_layer.rooms[self.room_group_name].remove(self.player_role)


    async def receive(self, text_data):
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game.message",
                "message": data
            }
        )
    
    async def game_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps(message))

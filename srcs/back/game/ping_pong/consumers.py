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
       try:
           self.room_id = self.scope['url_route']['kwargs']['room']
           query_string = parse_qs(self.scope['query_string'].decode())
           self.player_id = query_string.get('player_id', [str(uuid.uuid4())])[0]
           
           self.role = GameManager.joinRoom(self.room_id, self.player_id)
           if not self.role:
               await self.close()
               return

           await self.channel_layer.group_add(self.room_id, self.channel_name)
           await self.accept()

           await self.send(json.dumps({
               "type": "status",
               "wait": 1 if len(GameManager.games[self.room_id]["players"]) < 2 else 0
           }))

           await self.send(json.dumps({"type": "role", "role": self.role, "player_id": self.player_id}))
           
           if not GameManager.isGameLoopRunning(self.room_id):
               GameManager.setGameLoopRunning(self.room_id, True)
               self.game_loop_task = asyncio.create_task(self.game_loop())
       except Exception as e:
           logger.error(f"Error during WebSocket connect: {e}")
           await self.close()

           # Add to channel group
           await self.channel_layer.group_add(self.room_id, self.channel_name)
           await self.accept()

           # Send the player's role back to them
           await self.send(json.dumps({"type": "role", "role": self.role, "player_id": self.player_id}))
           if len(GameManager.games[self.room_id]["players"]) == 2:
               await self.channel_layer.group_send(
                   self.room_id,
                   {
                       "type": "game_update",
                       "message": {
                           "type": "status",
                           "wait": 0  # Notify that waiting is over
                       },
                   },
               )
           # Start the game loop only if this is the first player
           if not GameManager.isGameLoopRunning(self.room_id):
               GameManager.setGameLoopRunning(self.room_id, True)
               self.game_loop_task = asyncio.create_task(self.game_loop())


    async def disconnect(self, close_code):
        if hasattr(self, 'game_loop_task'):
            self.game_loop_task.cancel()
    
        GameManager.leaveRoom(self.room_id, self.player_id)
        await self.channel_layer.group_discard(self.room_id, self.channel_name)
    
        if GameManager.isRoomEmpty(self.room_id):
            GameManager.setGameLoopRunning(self.room_id, False)


    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "ballUpdate":
            # Validate ball position and update server state
            game = GameManager.games.get(self.room_id)
            if game:
                # Ensure ball position is within bounds
                ball = data["ball"]
                if 0 <= ball["x"] <= GameManager.BOARD_WIDTH and 0 <= ball["y"] <= GameManager.BOARD_HEIGHT:
                    game["ball"].update(ball)
        elif data["type"] == "paddleMove":
            GameManager.handleMessage(self.room_id, self.role, data)
    
    
    

    async def broadcast(self, event):
        await self.send(json.dumps(event["message"]))


    async def game_update(self, event):
        # Send the game state to the WebSocket client
        await self.send(json.dumps({
            "type": "update",
            "ball": event["game_state"]["ball"],
            "scores": event["game_state"]["scores"],
            "wait": 0,
            "players": {
                role: {
                    "y": player["y"]
                }
                for role, player in event["game_state"]["players"].items()
            },
        }))

    async def game_loop(self):
        try:
            while True:
                GameManager.updateBallPos(GameManager.games[self.room_id])
                await self.channel_layer.group_send(
                    self.room_id,
                    {
                        "type": "game_update",
                        "game_state": GameManager.games[self.room_id],
                    },
                )
                # Adjust the loop speed (e.g., 60 FPS = ~16ms per frame)
                await asyncio.sleep(1 / 15)
        except asyncio.CancelledError:
            logger.info(f"Game loop cancelled for room: {self.room_id}")
        except Exception as e:
            logger.error(f"Error in game loop: {e}")


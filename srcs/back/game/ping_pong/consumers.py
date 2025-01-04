from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from .gameManager import GameManager
import json
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

            # Player joins the room
            self.role = GameManager.joinRoom(self.room_id, self.player_id)
            if not self.role:
                await self.close()
                return

            await self.channel_layer.group_add(self.room_id, self.channel_name)
            await self.accept()

            total_players = len(GameManager.games[self.room_id]["players"])

            logger.info(f"Role: {self.role}, Players: {total_players}")

            # Send player's role to the client
            await self.send(json.dumps({
                "type": "role",
                "role": self.role,
                "player_id": self.player_id
            }))

			# Send game status (waiting for player => wait: 1)
            await self.send(json.dumps({
                "type": "status",
                "wait": 1 if total_players < 2 else 0
            }))

            # Notify all players if two players are ready
            if total_players == 2:
                logger.info(f"total players = 2")
                await self.channel_layer.group_send(
                    self.room_id,
                    {
                        "type": "game_update",
                        "message": {"type": "status", "wait": 0}
                    }
                )

                # Start game loop if not running
                if not GameManager.isGameLoopRunning(self.room_id):
                    logger.info(f"player: {self.role} isgamelooprunning")
                    GameManager.setGameLoopRunning(self.room_id, True)
                    self.game_loop_task = asyncio.create_task(self.game_loop())
        except Exception as e:
            logger.error(f"Error during WebSocket connect: {e}")
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'game_loop_task'):
            self.game_loop_task.cancel()
        await self.channel_layer.group_send(
            self.room_id,
            {
                "type": "game_update",
                "message": {"type": "status", "wait": 1}
            }
        )

        GameManager.leaveRoom(self.room_id, self.player_id)
		# Remove player from the group so it can only send msg to the server
        await self.channel_layer.group_discard(self.room_id, self.channel_name)

        GameManager.setGameLoopRunning(self.room_id, False)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data["type"] == "ballUpdate":
                # Validate and update ball position
                game = GameManager.games.get(self.room_id)
                if game:
                    ball = data["ball"]
                    if (0 <= ball["x"] <= GameManager.BOARD_WIDTH and
                            0 <= ball["y"] <= GameManager.BOARD_HEIGHT):
                        game["ball"].update(ball)
            elif data["type"] == "paddleMove":
                GameManager.handleMessage(self.room_id, self.role, data)
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    async def broadcast(self, event):
        await self.send(json.dumps(event["message"]))

    async def game_update(self, event):
        await self.send(json.dumps({
            "type": "update",
            **event["message"],
        }))

    async def game_loop(self):
        try:
            while True:
                game_state = GameManager.games[self.room_id]
                if len(game_state["players"]) < 2:
                    break
                GameManager.updateBallPos(game_state)

                await self.channel_layer.group_send(
                    self.room_id,
                    {
                        "type": "game_update",
                        "message": {
                            "ball": game_state["ball"],
                            "scores": game_state["scores"],
                            "players": {
                                role: {"y": player["y"]}
                                for role, player in game_state["players"].items()
                            },
                        }
                    }
                )

                await asyncio.sleep(1 / 30)  # 15 FPS
        except asyncio.CancelledError:
            logger.info(f"Game loop cancelled for room: {self.room_id}")
        except Exception as e:
            logger.error(f"Error in game loop: {e}")


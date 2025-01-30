from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from .gameManager import GameManager
from datetime import datetime
from django.conf import settings
import json
import logging
import uuid
import asyncio
import jwt

logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		logger.info("\033[1;32mCONNECT METHOD CALLED\033[0m")
		try:
			self.role = None
			# Get the room_id from the URL
			self.room_id = self.scope['url_route']['kwargs']['room']
			self.user = self.scope['user']
			# query_string = parse_qs(self.scope['query_string'].decode())

			# # Extract the JWT token from the query string (pass the token as a query param 'token')
			# token = query_string.get('token', [None])[0]
			logger.info(f"user: {self.user}")

			# if token:
			# 	try:
			# 		# Decode the JWT token (replace 'your_secret_key' with your actual secret key)
			# 		decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
			# 		# Get user information from the decoded token
			# 		self.user = decoded_token.get('user', None)

			# 		if self.user:
			# 			logger.info(f"Authenticated user: {self.user}")
			# 		else:
			# 			logger.warning(f"Invalid token: {decoded_token}")
			# 			await self.close()
			# 			return
			# 	except jwt.ExpiredSignatureError:
			# 		logger.warning("JWT token has expired.")
			# 		await self.close()
			# 		return
			# 	except jwt.InvalidTokenError:
			# 		logger.warning("Invalid JWT token.")
			# 		await self.close()
			# 		return
			# else:
			# 	logger.warning("No token provided.")
			# 	await self.close()
			# 	return

			# Player joins the room
			self.role = GameManager.joinRoom(self.room_id, self.user)
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
				"user": self.user
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
		logger.info("DISCONNECT METHOD CALLED")
		if self.role is None:
			logger.warning("Disconnect called before role assignment.")
			return
	
		disc_role = self.role
		logger.info(f"user with role {disc_role} is leaving")
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
	
		game_state = GameManager.games.get(self.room_id)
		if game_state and len(game_state["players"]) == 1:
			remaining_player = next(iter(game_state["players"].values()))
			winner_msg = await GameManager.start_disconnect_countdown(self.room_id, remaining_player["id"], disc_role)
			if winner_msg:
				await self.channel_layer.group_send(
					self.room_id,
					{
						"type": "game_endgame",
						"message": winner_msg
					}
				)
	
		await self.channel_layer.group_discard(self.room_id, self.channel_name)
		GameManager.setGameLoopRunning(self.room_id, False)
	
	async def receive(self, text_data):

		try:
			data = json.loads(text_data)
			game = GameManager.games.get(self.room_id)
			if not game:
				return
			if data["type"] == "update" or data["type"] == "ballUpdate":
				msg = GameManager.handleMessage(self.room_id, self.role, data)
				
			await self.channel_layer.group_send(
				self.room_id,
				{
					"type": "game_update",
					"message": msg
				}
			)

		except Exception as e:
			logger.error(f"Error processing message: {e}")
			logger.info(f"\033[1;31m{text_data}\033[0m");

	async def broadcast(self, event):
		await self.send(json.dumps(event["message"]))

	async def game_update(self, event):
		await self.send(json.dumps({
			"type": "update",
			**event["message"],
		}))

	async def game_endgame(self, event):
		logger.info("\033[1;32mENDGAME METHOD CALLED\033[0m")
		await self.send(json.dumps({
			"type": "endgame",
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

				await asyncio.sleep(1 / 15)  # 15 FPS
		except asyncio.CancelledError:
			logger.info(f"Game loop cancelled for room: {self.room_id}")
		except Exception as e:
			logger.error(f"Error in game loop: {e}")


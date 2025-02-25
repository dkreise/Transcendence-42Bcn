from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from .gameManager import GameManager
#from .tournamentManager import TournamentManager
from datetime import datetime
from django.conf import settings
import json
import logging
import uuid
import asyncio

logger = logging.getLogger(__name__)

active_games = {}
active_games_lock = asyncio.Lock()
active_tournaments = {}
active_tournaments_lock = asyncio.Lock()

class ThrowError(Exception):
	pass

class PongConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		logger.info("\033[1;32mCONNECT METHOD CALLED\033[0m")
		try:
			self.type = self.scope['url_route']['kwargs']['type']
			self.user = self.scope['user']
			self.role = None
		#	if self.type == "T":
		#		#call tournament manager
		#		try:
		#			self.tour_id = self.scope['url_route']['kwargs']['tgID']
		#			async with active_tournaments_lock:
		#				active_tournaments[self.tour_id] = TournamentManager(self.tour_id)
		#		except Exception as e:
		#			logger.error(f"Error connecting to the tournament: {e}")
		#			await self.close()
		#	elif self.type == "G":
			if self.type == "G":
				#call game manager
				try:
					self.room_id = self.scope['url_route']['kwargs']['tgID']
					async with active_games_lock:
						if self.room_id not in active_games:
							active_games[self.room_id] = GameManager(self.room_id)
						# TODO: False should be dynamic (player = T / viewer = F)
						game = active_games[self.room_id]
						self.role = await game.join_room(self.user.username, False)
						if not self.role:
							await self.close()
							return
						# Notify the client of their role
						logger.info(f"sending role msg to {self.role}")
						await self.accept()
						await self.send(json.dumps({
							"type": "role",
							"role": self.role,
							#"user": self.user.username,
							"canvasX": game.board_config["width"],
							"canvasY": game.board_config["height"],
							"padW": game.paddle_config["width"],
							"padH": game.paddle_config["height"],
							"padS": game.paddle_config["speed"]
						}))
						await self.channel_layer.group_add(self.room_id, self.channel_name)
						logger.info(f"role sent. current users: {game.users} len: {len(game.users)}")
						if len(game.users) == 2:
							await game.send_players_id()
							#asyncio.sleep(2)
							#logger.info(f"{self.role} starts the game")
							#await game.start_game()
						else:
							await game.send_status(0)
						#logger.info(f"Role: {self.role}")

				except Exception as e:
					logger.error(f"\033[1;31mError connecting to the game: {e}\033[0m")
					await self.close()

			else:
				raise ThrowError("\033[1;31mUnexpected input when connecting to websocket\033[0m")
		except Exception as e:
			logger.error(f"\033[1;31mError during Websocket connect: {e}\033[0m")
			await self.close()

###################################################

	async def disconnect(self, close_code):
		logger.info("\033[1;32mDISCONNECT METHOD CALLED\033[0m")

		if self.room_id not in active_games:
			await self.close()
			return
		game = active_games[self.room_id]
		await game.leave_room(self.role, self.user.username)
		await self.channel_layer.group_discard(
			self.room_id,
			self.channel_name
		)
		if not game.users:
			async with active_games_lock:
				del active_games[self.room_id]
		await self.close()

##################################################

	async def receive(self, text_data):
		logger.info("\033[1;32mRECEIVE METHOD CALLED\033[0m")
		try:
			data = json.loads(text_data)
			game = active_games[self.room_id]
			if data["type"] == "update":
				game.handle_message(self.role, data)
				await game.update_game()
			elif data["type"] == "ready":
				game.ready += 1
				logger.info(f"Ready: {game.ready}")
				if game.ready == 2:
					game.status = 1
					await game.send_status(4)
					logger.info(f"{self.role} starts the game")
					await game.start_game()
		except Exception as e:
			logger.error(f"\033[1;31mError receiving a message via WebSocket: {e}\033[0m")
	
###################################################

	async def send_game_msg(self, event):
		#logger.info(f"SGM: sending message {event['message']}")
		await self.send(text_data=json.dumps(event["message"]))

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
						await self.channel_layer.group_add(self.room_id, self.channel_name)
						await self.accept()
						# Notify the client of their role
						await self.send(json.dumps({
							"type": "role",
							"role": self.role,
							#"user": self.user.username,
							"canvasX": 800,
							"canvasY": 400
						}))
						if len(game.players) == 2:
							await self.send(json.dumps({
								"type": "players",
								"me": self.user.username,
								"you": next((other for other in game.users if other != self.user.username))
							}))
							active_games[self.room_id].start_game()
						else:
							await game.send_status(0)


						logger.info(f"Role: {self.role}")

				except Exception as e:
					logger.error(f"\033[1;31mError connecting to the game: {e}\033[0m")
					await self.close()

			else:
				raise ThrowError("\033[1;31munexpected input when connecting to websocket\033[0m")
		except Exception as e:
			logger.error(f"\033[1;31mError during Websocket connect: {e}\033[0m")
			await self.close()

###################################################

	async def disconnect(self, close_code):
		logger.info("\033[1;32mDISCONNECT METHOD CALLED\033[0m")

		await self.channel_layer.group_discard(
			self.room_id,
			self.channel_name
		)
		if self.room_id in active_games:
			game = active_games[self.room_id]
			game.cancel_disconnect_task()

			if self.role in game.players:
				del game.players[self.role]
			if len(game.players) < 2:
				game.stop_game()

			if not game.players:
				async with active_games_lock:
					del active_games[self.room_id]
		await self.close()

##################################################

	async def receive(self, text_data):
		try:
			data = json.loads(text_data)
			if data["type"] == "update":
				game = active_games[self.room_id]
				game.handle_message(self.role, data)
				await game.update_game()
		except Exception as e:
			logger.error(f"\033[1;31mError receiving a message via WebSocket: {e}\033[0m")
	
###################################################

	async def send_game_msg(self, event):
		await self.send(text_data=json.dumps(event["message"]))

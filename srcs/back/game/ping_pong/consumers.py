from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from .gameManager import GameManager
from .tournamentManager import TournamentManager
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
ws_codes = {
	"4000": "You're already in the room",
	"4001": "Error trying to reconnect. Please, try again later",
	"4002": "Access denied. The room is already full"
}


class ThrowError(Exception):
	pass

class PongConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		logger.info("\033[1;32mCONNECT METHOD CALLED\033[0m")
		try:
			self.type = self.scope['url_route']['kwargs']['type']
			self.user = self.scope['user']
			self.role = None
			logger.info(f"SELF.TYPE: {self.type}")
			if self.type == "T":
				#call tournament manager
				try:
					self.tour_id = self.scope['url_route']['kwargs']['tgID']
					logger.info(f"T.ID::{self.tour_id}")
					max_user_cnt = self.get_nb_users_from_url()
					async with active_tournaments_lock:
						if self.tour_id not in active_tournaments:
							active_tournaments[self.tour_id] = TournamentManager(self.scope, self.tour_id, max_user_cnt) #add tournament in array activetournaments
						tournament = active_tournaments[self.tour_id]
						tournament.add_player(self.user.username)
						await self.channel_layer.group_add(self.tour_id, self.channel_name)
						await self.accept()
						logger.info("accepted..")
						logger.info(f"self.channel_name: {self.channel_name}")

						if tournament.get_players_cnt() < tournament.max_user_cnt:
							page = tournament.get_waiting_room_page()
							await self.channel_layer.group_send(
								self.tour_id,
								{
									"type": "new_player_cnt",
									# "player_cnt": tournament.get_players_cnt(),
								}
							)
							await self.send(text_data=json.dumps({
								"type": "html",
								"html": page['html'],
								"redirect": page['redirect'],
								"status": "waiting",
							}))
						else:
							page = tournament.get_bracket_page()
							tournament.increase_round()
							await self.channel_layer.group_send(
								self.tour_id,
								{
									"type": "tournament_starts",
									"message": "Tournament has started",
									"status": "playing",
								}
							)

						# await self.send(text_data=json.dumps({
						# 	"type": "html",
						# 	"html": page['html'],
						# 	"redirect": page['redirect'],
						# }))

				except Exception as e:
					logger.error(f"Error connecting to the tournament: {e}")
					await self.close()

			elif self.type == "G":
				try:
					self.room_id = self.scope['url_route']['kwargs']['tgID']
					async with active_games_lock:
						if self.room_id not in active_games:
							active_games[self.room_id] = GameManager(self.room_id)
						# TODO: False should be dynamic (player = T / viewer = F)
						game = active_games[self.room_id]
						self.role = await game.join_room(self.user.username, False)
						await self.accept()
						if "player" not in self.role:
							await self.send(json.dumps({
								"type": "reject",
								"reason": ws_codes[self.role],
								"code": self.role
							}))
							await self.close(int(self.role))
							return
						# Notify the client of their role
						await self.channel_layer.group_add(self.room_id, self.channel_name)
						logger.info(f"sending role msg to {self.role}")
						await game.send_role(self.channel_name, self.role)
						logger.info(f"role sent. current users: {game.users} len: {len(game.users)}")
						if len(game.users) == 2:
							await game.send_players_id()
						else:
							await game.send_status(0)

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

		if self.type == "G":
			await self.channel_layer.group_discard(
				self.room_id,
				self.channel_name
			)
			if self.room_id in active_games:
				game = active_games[self.room_id]
				game.cancel_disconnect_task()

				if self.role in game.players:
					del game.players[self.role]
					logger.info(f"Current users in the room: {game.users}")
					logger.info(f"Current players in the room: {game.players}")
				if len(game.players) < 2:
					game.stop_game()

				if not game.players:
					async with active_games_lock:
						if self.room_id in active_games:
							del active_games[self.room_id]
							logger.info(f"Room {self.room_id} has been deleted")
		elif self.type == "T":
			# We will only disconnect socket when tournament is finished
			await self.channel_layer.group_discard(
				self.tour_id,
				self.channel_name
			)
			async with active_tournaments_lock:
				if self.tour_id in active_tournaments:
					del active_tournaments[self.tour_id] # to handle properly

		await self.close()

##################################################

	async def receive(self, text_data):
		#logger.info("\033[1;32mRECEIVE METHOD CALLED\033[0m")
		if self.type == "G":
			ready_lock = asyncio.Lock()
			try:
				data = json.loads(text_data)
				game = active_games[self.room_id]
				if data["type"] == "update":
					game.handle_message(self.role, data)
					await game.update_game()
				elif data["type"] == "ready":
					async with active_games_lock:
						game.ready += 1
						logger.info(f"{self.user} is ready: {game.ready}")
						if game.ready == 2:
							game.status = 1
							logger.info(f"{self.role} ({self.user})starts the game")
							await game.start_game(self.user)
				elif data["type"] == "close":
					logger.info("\033[1;32mRECEIVE METHOD CALLED: closed WS\033[0m")
			except Exception as e:
				logger.error(f"\033[1;31mError receiving a message via WebSocket: {e}\033[0m")
		if self.type == "T":
			try:
				data = json.loads(text_data)
				tournament = active_tournaments[self.tour_id]
				dtype = data["type"]
				if dtype == "bracket_page_request":
					page = tournament.get_bracket_page()
					await self.send(text_data=json.dumps({
						"type": "html",
						"html": page['html'],
						"status": page['status'],
					}))
				elif dtype == "waiting_room_page_request":
					page = tournament.get_waiting_room_page()
					await self.send(text_data=json.dumps({
						"type": "html",
						"html": page['html'],
						"status": "waiting",
					}))

				elif dtype == "final_page_request":
					page = tournament.get_final_page()
					await self.send(text_data=json.dumps({
						"type": "html",
						"html": page['html'],
						"status": "finished",
					}))

				elif dtype == "game_result":
					logger.info("RECEIVED. we need to handle game result")
					status = await tournament.handle_game_end(data)
					if status == "new":
						tournament.increase_round()
						await self.channel_layer.group_send(
								self.tour_id,
								{
									"type": "tournament_starts",
									"message": "New round has started",
									"status": "playing",
								}
							)
					elif status == "finished":
						await self.channel_layer.group_send(
								self.tour_id,
								{
									"type": "tournament_ends",
									"message": "Tournament has finished",
									"status": "finished",
								}
							)

			except Exception as e:
				logger.error(f"\033[1;31mError receiving a message via WebSocket: {e}")
	
###################################################

	async def send_game_msg(self, event):
		await self.send(text_data=json.dumps(event["message"]))
	
	async def send_endgame(self, event):
		logger.info("\033[1;32mEndgame, kudos to the winner!\033[0m")
		try:
			await self.send(text_data=json.dumps(event["message"]))
			async with active_games_lock:
				if self.room_id in active_games:
					del active_games[self.room_id]
					await self.close()
		except Exception as e:
			logger.error(f"Error sending endgame: {e}")

###################################################

	async def tournament_starts(self, event):
		tournament = active_tournaments[self.tour_id]
		round_data = tournament.handle_tournament_start(self.user.username)
		page = tournament.get_bracket_page()
		await self.send(text_data=json.dumps({
			"type": "html",
			"html": page['html'],
			"redirect": "/tournament-bracket",
			"needs_to_play": round_data['needs_to_play'],
			"opponent": round_data['opponent'],
			"status": "playing",
		}))

	async def tournament_ends(self, event): #TODO: manage when it appears
		tournament = active_tournaments[self.tour_id]
		page = tournament.get_final_page()
		await self.send(text_data=json.dumps({
			"type": "html",
			"html": page['html'],
			"redirect": "/end-tournament",
			"status": "finished",
		}))

	async def new_player_cnt(self, event):
		tournament = active_tournaments[self.tour_id]
		await self.send(text_data=json.dumps({
			"type": "new_player_cnt",
			"player_cnt": tournament.get_players_cnt(),
		}))

###################### UTILS #############################

	def get_nb_users_from_url(self):
		query_string = self.scope['query_string'].decode('utf-8')
		query_params = parse_qs(query_string)
		nPlayers = query_params.get('nPlayers', [None])[0]
		try:
			return int(nPlayers)
		except (ValueError, TypeError):
			return 0

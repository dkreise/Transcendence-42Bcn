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
from .websocket_state import active_tournaments, active_tournaments_lock

logger = logging.getLogger(__name__)

active_games = {}
active_games_lock = asyncio.Lock()
# active_tournaments = {}
# active_tournaments_lock = asyncio.Lock()


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
						# Check if the tournament is already full
						if self.user.username not in tournament.users and (tournament.get_players_cnt() >= tournament.max_user_cnt or tournament.round > 0):
							logger.info("Tournament is full. Rejecting connection.")
							await self.accept()
							await self.send(text_data=json.dumps({
								"type": "full",
								"message": "Tournament is full or has already started.",
							}))
							# await asyncio.sleep(0.5)  # Small delay to let the message reach the frontend
							# await self.close()
							return
						status = tournament.add_player(self.user.username)
						await self.channel_layer.group_add(self.tour_id, self.channel_name)
						await self.accept()
						logger.info("accepted..")
						logger.info(f"self.channel_name: {self.channel_name}")
						if status == "reload":
							return

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
								"request": True,
								"replace": True,
							}))
						else:
							# page = tournament.get_bracket_page(self.user.username) 
							tournament.increase_round()
							await self.channel_layer.group_send(
								self.tour_id,
								{
									"type": "tournament_starts",
									"message": "Tournament has started",
									"status": "playing",
								}
							)

				except Exception as e:
					logger.error(f"Error connecting to the tournament: {e}")
					await self.close()

			elif self.type == "G":
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
				if len(game.players) < 2:
					game.stop_game()

				if not game.players:
					async with active_games_lock:
						del active_games[self.room_id]
		elif self.type == "T":
			logger.info(f"\033[1;31mclose_code={close_code}\033[0m")
			if close_code in [1001, 1006]:  # WebSocket transport error / browser close
				logger.info("Unexpected disconnect. Keeping tournament active.")
				return  # Do not remove the user!
			# We will only disconnect socket when tournament is finished or QUIT
			logger.info("Removing user from group..")
			await self.channel_layer.group_discard(
				self.tour_id,
				self.channel_name
			)
			logger.info(f"tour_id: {self.tour_id}")
			if self.tour_id in active_tournaments:
				tournament = active_tournaments[self.tour_id]
				logger.info(f"still users cnt: {len(tournament.users)}")
				if len(tournament.users) == 1:
					logger.info(f"last user: {tournament.users[0]}")
				if len(tournament.users) == 0 or (len(tournament.users) == 1 and tournament.users[0] == "@AI"):
					logger.info("All players left. Deleting tournament..")
					async with active_tournaments_lock:
						if self.tour_id in active_tournaments:
							del active_tournaments[self.tour_id]
		logger.info("closing...")
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
					page = tournament.get_bracket_page(self.user.username)
					await self.send(text_data=json.dumps({
						"type": "html",
						"html": page['html'],
						"needs_to_play": page['needs_to_play'],
						"opponent": page['opponent'],
						"status": page['status'],
						"request": True,
					}))
				elif dtype == "waiting_room_page_request":
					page = tournament.get_waiting_room_page()
					await self.send(text_data=json.dumps({
						"type": "html",
						"html": page['html'],
						"status": "waiting",
						"request": True,
					}))

				elif dtype == "final_page_request":
					page = tournament.get_final_page()
					await self.send(text_data=json.dumps({
						"type": "html",
						"html": page['html'],
						"status": "finished",
						"request": True,
					}))

				elif dtype == "game_result":
					logger.info("RECEIVED. we need to handle game result")
					status = await tournament.handle_game_end(data, False)
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
					elif status == "continue":
						await self.channel_layer.group_send(
								self.tour_id,
								{
									"type": "tournament_update",
									"message": "Tournament has updated",
									"status": "playing",
								}
							)

				elif dtype == "quit":
					logger.info("player wants to quit the tournament. handling quit..:")
					status = await tournament.handle_quit(self.user.username, False)
					logger.info("we handled the quit. now disconnecting..:")
					await self.disconnect(1000)
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

				elif dtype == "game_started":
					logger.info(f"GAME STARTED BY {self.user.username}")
					tournament.set_match_start(self.user.username)
				
				elif dtype == "wants_to_play":
					logger.info("REQUEST TO PLAY")
					needs_to_play = tournament.if_needs_to_play(self.user.username)
					logger.info(f"needs to play ? {needs_to_play}")
					await self.send(text_data=json.dumps({
						"type": "needs_to_play",
						"needs_to_play": needs_to_play,
					}))
				
				elif dtype == "get_status":
					status = tournament.get_status()
					await self.send(text_data=json.dumps({
						"type": "status",
						"status": status,
					}))
				
				# elif dtype == "tournament_delete":
				# 	logger.info("WE RECEIVED that it's needed to delete")
				# 	await self.tournament_delete()

			except Exception as e:
				logger.error(f"\033[1;31mError receiving a message via WebSocket: {e}")
	
###################################################

	async def send_game_msg(self, event):
		#logger.info(f"SGM: sending message {event['message']}")
		await self.send(text_data=json.dumps(event["message"]))

###################################################

	async def tournament_starts(self, event):
		logger.info(f"TOURNAMENT_STARTS FOR {self.user.username}")
		tournament = active_tournaments[self.tour_id]
		round_data = tournament.handle_tournament_start(self.user.username)
		page = tournament.get_bracket_page(self.user.username)
		await self.send(text_data=json.dumps({
			"type": "html",
			"html": page['html'],
			"redirect": "/tournament-bracket",
			"needs_to_play": round_data['needs_to_play'],
			"opponent": round_data['opponent'],
			"status": "playing",
			"replace": True,
		}))

	async def tournament_ends(self, event):
		logger.info(f"TOURNAMENT_ENDS FOR {self.user.username}")
		tournament = active_tournaments[self.tour_id]
		page = tournament.get_final_page()
		await self.send(text_data=json.dumps({
			"type": "html",
			"html": page['html'],
			"redirect": "/end-tournament",
			"status": "finished",
		}))

	async def tournament_update(self, event):
		logger.info(f"TOURNAMENT_UPDATE FOR {self.user.username}")
		tournament = active_tournaments[self.tour_id]
		page = tournament.get_bracket_page(self.user.username)
		await self.send(text_data=json.dumps({
			"type": "html",
			"html": page['html'],
			"redirect": "/tournament-bracket",
			"needs_to_play": page['needs_to_play'],
			"opponent": page['opponent'],
			"status": "playing",
		}))
	
	async def tournament_delete(self, event):
		logger.info("Removing user from group BECAUSE IT'S TIME..")
		await self.channel_layer.group_discard(
			self.tour_id,
			self.channel_name
		)
		async with active_tournaments_lock:
			if self.tour_id in active_tournaments:
				logger.info("DELETING TOURNAMENT!!")
				del active_tournaments[self.tour_id]
		logger.info("closing...")
		await self.close()

	async def new_player_cnt(self, event):
		tournament = active_tournaments[self.tour_id]
		await self.send(text_data=json.dumps({
			"type": "new_player_cnt",
			"player_cnt": tournament.get_players_cnt(),
		}))
	
	# async def start_countdown_until_close(self):
	# 	async with active_tournaments_lock:
	# 		tournament = active_tournaments[self.tour_id]
	# 		if tournament.needs_countdown:
	# 			tournament.nees
	# 			await asyncio.sleep(30)
		

###################### UTILS #############################

	def get_nb_users_from_url(self):
		query_string = self.scope['query_string'].decode('utf-8')
		query_params = parse_qs(query_string)
		nPlayers = query_params.get('nPlayers', [None])[0]
		try:
			return int(nPlayers)
		except (ValueError, TypeError):
			return 0

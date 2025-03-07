from collections import defaultdict
import logging
import asyncio
from asgiref.sync import sync_to_async
# from .views import save_remote_score
from django.contrib.auth import get_user_model
# from .models import Game
from django.db import transaction
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async

def get_game_model():
	 from .models import Game  # Import inside function
	 return Game

#def get_user_model():
#	 from .models import Game  # Import inside function
#	 return User

logger = logging.getLogger(__name__)

'''
players
	L player1
		L id [string]	#username
		L y  [int]		#paddle's y coord
	L player2
		L id [string]
		L y  [int]
'''

'''
users {"user1", "user2"}	#bkup of the players' usernames (for connection control purposes)
'''

'''
viewers {"user3", "user4", ...}	#probably not gonna use it
'''

'''
ball
	L x			[int]	#ball's x position
	L y			[int]	#ball's y position
	L xspeed	[int]	#ball's speed: x component
	L yspeed	[int]	#ball's speed: y component
'''

'''
scores
	L player1	[int]	#player1's score
	L player2	[int]	#player2's score
'''

'''
midas => absoluto
posiciones en tanto por uno
'''
class GameManager:

	ball_config = {"rad": 7, "xspeed": 5, "yspeed":8}
	board_config = {"width": 400, "height": 300, "max_score": 3}
	paddle_config = {"width": 10, "height": 50, "speed": 5}
	countdown = 5

	def __init__(self, game_id):
		self.id = game_id
		self.players = {}
		self.users = []
		self.viewers = {}
		self.ball_lock = asyncio.Lock() #similar to mutex
		self.scores = {"player1": 0, "player2": 0}
		self.disconnect_task = None
		self.game_loop_task = None
		self.status = 1
		self.ready = 0
		self.start = True
		self.channel_layer = get_channel_layer()
		self.ball = {
			"x": 0.5,
			"y": 0.5,
			"xspeed": GameManager.ball_config["xspeed"],
			"yspeed": GameManager.ball_config["yspeed"]
		}

###############################################

	async def join_room(self, user, play): #user = [string] username || play = [bool] player/viewer
		logger.info(f"room id {self.id} total players: {len(self.players)}")
		logger.info(f"current players in the room: {self.players}")
		if any(player["id"] == user for player in self.players.values()):
			self.cancel_disconnect_task()
			role = next((key for key, value in self.players.items() if value["id"] == user), None)
			if role:
				if user in self.users:
					logger.info(f"{user} is already in the room. Rejecting new connection")
					#await self.send_reject(channel, "You're already connected to this room!")
					return "4000"
				if len(self.players) == 2:
					self.status = 0
					self.users.append(user)
				return role
			logger.info(f"Reconnection error for user {user}. Please, try again later")
			#await self.send_reject(channel, "Error trying to reconnect. Try again later")
			return "4001"

		#if play == False:
			#handle viewers

		elif len(self.players) >= 2:
			logger.info(f"Access denied to {user}. Room {self.id} is already full")
			#await self.send_reject(channel, "The room is already full!")
			return "4002"
		else:
			self.users.append(user)
			if len(self.players) == 0:
				logger.info(f"adding {user} as player1")
				self.players["player1"] = {"id": user, "y": 0.5}
				return "player1"
			else:
				logger.info(f"adding {user} as player2")
				self.players["player2"] = {"id": user, "y": 0.5}
				self.status = 0
				return "player2"
		return "viewer"

#################################################

	def handle_message(self, role, data):
		if data["type"] == "update" and data["role"] in self.players and data["y"]:
			self.players[data["role"]]["y"] = data["y"]

##################################################

	async def has_scored(self, role):
		logger.info(f"{role} has scored in room {self.id}")
		self.status = 1
		self.reset_positions(role)
		self.scores[role] += 1
		logger.info(f"current scores: {self.scores}\nMAX scores: {GameManager.board_config['max_score']}")
		if self.scores[role] == GameManager.board_config["max_score"]:
			await self.declare_winner(role)
		else:
			self.rsg_task = asyncio.create_task(self.ready_steady_go())
			await self.send_status(3)

	def is_pad_col_side(self):
		boardW = GameManager.board_config["width"]
		boardH = GameManager.board_config["height"]
		radius = GameManager.ball_config["rad"]
		padH = GameManager.paddle_config["height"] / 2
		pl1 = self.players["player1"]["y"] * boardW
		pl2 = self.players["player2"]["y"] * boardW

		if self.ball["x"] * boardW <= GameManager.paddle_config["width"]:
			if ((self.ball["y"] * boardH - radius > pl1 - padH - 1) and
				(self.ball["y"] * boardH + radius < pl1 + padH + 1)):
				return True
		elif self.ball["x"] * boardW + radius >= boardW - GameManager.paddle_config["width"]:
			if ((self.ball["y"] * boardH - radius > pl2 - padH - 1) and
				(self.ball["y"] * boardH + radius < pl2 + padH + 1)):
				return True
		return False

	def is_pad_col_top(self):
		radius = GameManager.ball_config["rad"]
		padH = GameManager.paddle_config["height"]
		padW = GameManager.paddle_config["width"]
		boardH = GameManager.board_config["height"]
		boardW = GameManager.board_config["width"]
		pl1_x = padW
		pl1_y = self.players["player1"]["y"] * boardW
		pl2_x = boardW - padW
		pl2_y = self.players["player1"]["y"] * boardW

		if self.ball["x"] * boardW - radius <= pl1_x:
			if ((self.ball["y"] * boardH + radius >= pl1_y - padH) or
				(self.ball["y"] * boardH - radius <= pl1_y + padH)):
				return True
		elif self.ball["x"] * boardW - radius >= pl2_x:
			if ((self.ball["y"] * boardH + radius >= pl2_y - padH) or
				(self.ball["y"] * boardH - radius <= pl2_y + padH)):
				return True
		return False

	async def update_ball(self):

		self.ball["x"] *= GameManager.board_config["width"] + self.ball["xspeed"]
		self.ball["y"] *= GameManager.board_config["height"] + self.ball["yspeed"]

		if self.is_pad_col_side():
			self.ball["xspeed"] *= -1
		elif self.is_pad_col_top():
			self.ball["yspeed"] *= -1
		elif self.ball["y"] <= 0 or self.ball["y"] >= GameManager.board_config["height"]:
			self.ball["yspeed"] *= -1
		if self.ball["x"] - GameManager.ball_config["rad"] <= 0:
			logger.info(f"{self.players['player1']} has scored")
			await self.has_scored("player1")
		elif self.ball["x"] + GameManager.ball_config["rad"] >= GameManager.board_config["width"]:
			logger.info(f"{self.players['player2']} has scored")
			await self.has_scored("player2")


##################################################

	async def ready_steady_go(self): #RSG
		logger.info("RSA 3 2 1...")
		try:
			await asyncio.sleep(4)
			self.status = 0
			await self.send_status(0)
		except Exception as e:
			logger.error(f"Error in Ready Steady Go: {e}")

#################################################

	def reset_positions(self, role):
		self.ball["x"] = 0.5
		self.ball["y"] = 0.5
		if role == "player1":
			self.ball["xspeed"] = -GameManager.ball_config["xspeed"]
			self.ball["yspeed"] = GameManager.ball_config["yspeed"]
		else:
			self.ball["xspeed"] = GameManager.ball_config["xspeed"]
			self.ball["yspeed"] = -GameManager.ball_config["yspeed"]

		self.players["player1"]["y"] = 0.5
		self.players["player2"]["y"] = 0.5

####################################################

	async def disconnect_countdown(self): #0 => task cancelled || 1 => task finished
		try:
			await asyncio.sleep(GameManager.countdown)
		except asyncio.CancelledError:
			logger.warn(f"\033[1;33mCountdown cancelled\033[0m")
			return 0
		return 1

	async def start_disconnect_countdown(self, disc_role):
		if self.disconnect_task:
			logger.warning(f"\033[1;33mCountdown task already exists for room {roomID}."
							"Overwriting previous task\033[0m")
		self.disconnect_task = asyncio.create_task(self.disconnect_countdown())
		finished_countdown = await self.disconnect_task
		self.disconnect_task = None

		if finished_countdown: #task finished => the opponent didn't reconnect
			if disc_role == "player1":
				await self.declare_winner("player2")
			else:
				await self.declare_winner("player1")
		else:
			await self.ready_steady_go()

#########################################################

	async def cancel_disconnect_task(self):
		if self.disconnect_task:
			self.disconnect_task.cancel()
			try:
				await self.disconnect_task
			except asyncio.CancelledError:
				pass
			self.disconnect_task = None
			self.status = 0

#########################################################

	async def declare_winner(self, winner_role):

		logger.info(f"and the winner is... {winner_role}")
		winner_id = self.players[winner_role]["id"]

		#game = get_game_model()

		logger.info(f"DW final scores: {self.scores}")
		#save the game result

		logger.info(f"pre-save_game_score")
		logger.info(winner_id)
		saved_game = await self.save_game_score(winner_id)
		# saved_game = ""
		logger.info(f"post-save_game_score")


		if saved_game:
			logger.info(f"Game successfully saved: {saved_game}")
		else:
			logger.info("F*ck, couldn't save the game")
		logger.info(f"Player {winner_id} wins in room {self.id}")
		loser = next((value['id'] for value in self.players.values() if value['id'] != winner_id), None)
		if not loser:
			logger.info("the f*ck no loser means?!")
		await self.send_endgame(winner_id, loser)


#########################################################


	@sync_to_async
	def save_game_score(self, winner_id):
		try:
			Game = get_game_model()
			with transaction.atomic(): #Ensure atomicity
				User = get_user_model()

				winner = User.objects.get(username=winner_id)
				# player1 = winner
				logger.info(winner_id)
				logger.info(self.players["player1"]["id"])
				# if self.players["player1"]["id"] == winner_id:
				player1 = User.objects.get(username=self.players["player1"]["id"])
				# else:
				player2 = User.objects.get(username=self.players["player2"]["id"])
				
				# if self.scores["player1"] > self.scores["player2"]:
				score1 = self.scores["player1"]
				score2 = self.scores["player2"]

				logger.info(f"SGS: winner: {winner.username}, player1: {player1.username}, player2: {player2.username}, score1: {score1}, score2: {score2}")

				# else:
				# 	score1 = self.scores["player2"]
				# 	score2 = self.scores["player1"]

				# Save the game result
				game = Game.objects.create(
					player1=player1,
					score_player1=score1,
					player2=player2,
					score_player2=score2,
					winner=winner,
					tournament_id=-1 # we need to make it dynamic
				)
				game.save()

				return game #return the saved game instance
				# return None

		except Exception as e:
			logger.info(f"Error saving game result: {e}")
			return None


#########################################################

	async def game_loop(self):
		logger.info(f"Starting game loop with status: {self.status}")
		try:
			self.start = False
			while True:
				#logger.info(f"Game loop => status: {self.status}")
				if self.status == 0:
					async with self.ball_lock:
						await self.update_ball()
					await self.send_update()
				await asyncio.sleep(0.016)
		except Exception as e:
			logger.error(f"Error in game loop: {e}")

##############################################################

	async def start_game(self, user):
		try: 
			logger.info(f"\033[1;33m{user} is Trying to start the game in room {self.id}\033[0m")
			if self.game_loop_task is None:
				self.status = 1
				logger.info(f"{user} is starting the countdown")
				await self.send_status(3)
				self.rsg_task = asyncio.create_task(self.ready_steady_go())
				logger.info(f"\033[1;33mThe game has started in room {self.id}\033[0m")
				self.game_loop_task = asyncio.create_task(self.game_loop())
		except Exception as e:
			logger.error(f"Error while trying to start the game: {e}")

	async def stop_game (self):
		logger.info(f"The game has stopped in room {self.id}")
		self.status = 1
		if self.game_loop_task:
			self.game_loop_task_cancel()
			self.game_loop_task = None
		await self.send_status(GameManager.countdown)

#################################################################

	def game_loop_task_cancel(self):
		if self.game_loop_task:
			self.game_loop_task.cancel()
			del self.game_loop_task
			self.game_loop_task = None
			self.status = 1

##################################################################33

	async def leave_room(self, role, user):
		self.users.remove(user)
		logger.info(f"user {user} was removed from active players")
		await self.stop_game()
		await self.start_disconnect_countdown(role)

####################################################################3

	async def send_players_id(self):
		logger.info("sending players' id (gameMan)")
		message = {
			"type": "players",
			"player1": self.players["player1"]["id"],
			"player2": self.players["player2"]["id"]
		}
		await self.channel_layer.group_send(
			self.id,
			{
				"type": "send_game_msg", #function in PongConsumer
				"message": message
			})

	async def send_status(self, countdown):
		logger.info(f"sending status msg (GM) wait: {self.status} cd: {countdown}")
		front_ball = self.ball
		front_ball["x"] *= GameManager.board_config["width"]
		front_ball["y"] *= GameManager.board_config["height"]
		front_players = self.players
		if front_players["player1"]:
			front_players["player1"]["y"] *= GameManager.board_config["height"]
		elif front_players["player2"]:
			front_players["player2"]["y"] *= GameManager.board_config["height"]
		message = {
			"type": "status",
			"ball": front_ball,
			"players": front_players,
			"scores": self.scores,
			"wait": self.status,
			"countdown": countdown
		}
		await self.channel_layer.group_send(
			self.id,
			{
				"type": "send_game_msg", #function in PongConsumer
				"message": message
			})
		logger.info(f"send_status: {self.players}")
		logger.info("\033[1;35mStatus Sent\033[0m")
	
	async def send_update(self):
		front_ball = self.ball
		front_ball["x"] *= GameManager.board_config["width"]
		front_ball["y"] *= GameManager.board_config["height"]
		front_players = self.players
		if front_players["player1"]:
			front_players["player1"]["y"] *= GameManager.board_config["height"]
		elif front_players["player2"]:
			front_players["player2"]["y"] *= GameManager.board_config["height"]
		message = {
			"type": "update",
			"ball": front_ball,
			"players": fornt_players,
			"scores": self.scores,
			"start": self.start
		}
		channel_layer = get_channel_layer()
		await channel_layer.group_send(
			self.id,
			{
				"type": "send_game_msg", #function in PongConsumer
				"message": message
			})

	async def send_role(self, channel_name, role):
		logger.info(f"Sending role and GameManager configs")
		message = {
			"type": "role",
			"role": role,
			"canvasX": GameManager.board_config["width"],	# canvas width
			"canvasY": GameManager.board_config["height"],	# canvas height
			"padW": GameManager.paddle_config["width"],	# paddle width
			"padH": GameManager.paddle_config["height"],	# paddle height
			"padS": GameManager.paddle_config["speed"],	# paddle speed
			"ballRad": GameManager.ball_config["rad"],		# ball radius
			"ballSx": GameManager.ball_config["xspeed"],	# ball xspeed
			"ballSy": GameManager.ball_config["yspeed"]	# ball yspeed
		}
		await self.channel_layer.send(
			channel_name,
			{
				"type": "send_game_msg", # function in PongConsumer
				"message": message
			})

	async def send_endgame(self, winner_id, loser_id):
		logger.info(f"let's send the endgame msg to the consumers")
		logger.info(f"winner: {winner_id} loser: {loser_id}")
		message = {
			"type": "endgame",
			"winner": winner_id,
			"loser": loser_id
		}
		try:
			await self.channel_layer.group_send(
				self.id,
				{
					"type": "send_endgame", #function in PongConsumer
					"message": message
				})
			logger.info("\033[1;35mEndgame sent\033[0m")
		except Exception as e:
			logger.error(f"send game error: {e}")

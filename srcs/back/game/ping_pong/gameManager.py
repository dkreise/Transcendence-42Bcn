from collections import defaultdict
import logging
import asyncio
# from .views import save_remote_score
from django.contrib.auth import get_user_model
# from .models import Game
from django.db import transaction

def get_game_model():
    from .models import Game  # Import inside function
    return Game


logger = logging.getLogger(__name__)

class GameManager:
	PADDLE_HEIGHT = 80
	BOARD_WIDTH = 800
	BOARD_HEIGHT = 500
	BALL_SPEED = 5
	COUNTDOWN = 100 #seconds a player can be disconnected before losing

	# Store all games
	games = {}
	disconnect_tasks = {}

	@classmethod
	def isGameLoopRunning(cls, room_id):
		return cls.games.get(room_id, {}).get("game_loop_running", False)

	@classmethod
	def setGameLoopRunning(cls, room_id, running):
		if room_id in cls.games:
			cls.games[room_id]["game_loop_running"] = running

	@classmethod
	def isRoomEmpty(cls, room_id):
		return room_id not in cls.games or not cls.games[room_id]["players"]

	@classmethod
	def joinRoom(cls, room_id, player_id):
		game = cls.games.setdefault(room_id, {
			"players": {},
			"ball": {"x": 400, "y": 250, "xspeed": cls.BALL_SPEED, "yspeed": cls.BALL_SPEED},
			"scores": {"player1": 0, "player2": 0},
			"game_loop_running": False
		})

		logger.info(f"\033[1;31mJOIN ROOM: game[players] = {game['players']}\033[0m")
		try:
			if game["players"]:
				player1 = game["players"].get("player1")
				player2 = game["players"].get("player2")
				if player1 and (player_id == player1["id"]):
					return "player1"
				elif player2 and (player_id == player2["id"]):
					return "player2"

				if len(game["players"]) >= 2:  # Max 2 players
					logger.info(f"\033[1;33mI'm FUCKING FULL\033[0m")
					return None  # Room is full
		except Exception as e:
			logger.info(str(e))

		role = "player1" if "player1" not in game["players"] else "player2"
		logger.info(f"\033[1;33mjoinRoom game->players {game['players']}\033[0m")
		game["players"][role] = {"id": player_id, "y": 250}  # Initial paddle position
		return role

	@staticmethod
	def leaveRoom(room_id, player_id):
		game = GameManager.games.get(room_id)
		if not game:
			return

		#for role, player in list(game["players"].items()):  # Safely iterate
		#	if player["id"] == player_id:
		#		del game["players"][role]
		#		logger.info(f"Player {role} left room {room_id}.")
		#		break

		if not game["players"]:  # Delete room if empty
			del GameManager.games[room_id]
			logger.info(f"Room {room_id} has been deleted.")

	@staticmethod
	def updateBallPos(game):
		ball = game["ball"]
		ball["x"] += ball["xspeed"]
		ball["y"] += ball["yspeed"]

		players = game["players"]

		# Paddle collisions
		if ball["x"] <= 20 and GameManager.isBallWithinPaddle(ball["y"], players.get("player1")):
			ball["xspeed"] *= -1
		elif ball["x"] >= GameManager.BOARD_WIDTH - 20 and GameManager.isBallWithinPaddle(ball["y"], players.get("player2")):
			ball["xspeed"] *= -1

		# Wall collisions
		if ball["y"] <= 0 or ball["y"] >= GameManager.BOARD_HEIGHT:
			ball["yspeed"] *= -1

		# Scoring
		if ball["x"] <= 0:  # Left wall
			game["scores"]["player2"] += 1
			GameManager.resetBall(ball, direction=1)
		elif ball["x"] >= GameManager.BOARD_WIDTH:  # Right wall
			game["scores"]["player1"] += 1
			GameManager.resetBall(ball, direction=-1)

	@staticmethod
	def isBallWithinPaddle(ball_y, paddle):
		if not paddle:
			return False
		return paddle["y"] <= ball_y <= paddle["y"] + GameManager.PADDLE_HEIGHT

	@staticmethod
	def resetBall(ball, direction):
		ball.update({"x": 400, "y": 250, "xspeed": GameManager.BALL_SPEED * direction, "yspeed": GameManager.BALL_SPEED})

	@staticmethod
	def handleMessage(room_id, role, data):
		game = GameManager.games.get(room_id)
		if not game:
			return {"type": "error", "message": "Game not found"}
		if data["type"] == "update":
			if (role == data["role"]) and (role in game["players"]):
				game["players"][role]["y"] = data["paddle"]
			game["scores"][data["role"]] = data["score"]
		elif data["type"] == "ballUpdate":
			ball = game["ball"]
			ball["x"] = data["x"]
			ball["y"] = data["y"]
			ball["xspeed"] = data["xspeed"]
			ball["yspeed"] = data["yspeed"]

		return {
			"type": "update",
			"ball": game["ball"],
			"scores": game["scores"],
			"players": {
				role: {"y": player["y"]} for role, player in game["players"].items()
			},
		}

	@staticmethod
	def save_remote_score(room_id, winner_id, scores, players):
		try:
			Game = get_game_model()
			with transaction.atomic():  # Ensure atomicity
				player1_id = players.get("player1")
				player2_id = players.get("player2")

				# Fetch users (set to None if they don't exist)
				# player1 = User.objects.filter(id=player1_id).first()
				# player2 = User.objects.filter(id=player2_id).first()
				winner = User.objects.filter(id=winner_id).first()
				player1 = winner
				player2 = User.objects.filter(id=player1_id).first() if player1_id == winner_id else User.objects.filter(id=player2_id).first()
				score1 = scores["player1"] if scores["player1"] > scores["player2"] else scores["player2"]
				score2 = scores["player1"] if scores["player1"] < scores["player2"] else scores["player2"]
				# Save the game result
				game = Game.objects.create(
					player1=player1,
					# alias1=players.get("alias1", "Guest" if not player1 else player1.username),
					score_player1=score1,
					player2=player2,
					# alias2=players.get("alias2", "Guest" if not player2 else player2.username),
					score_player2=score2,
					winner=winner,
					tournament_id=-1  # Set tournament_id accordingly if needed
				)
				game.save()

				return game  # Return the saved game instance

		except Exception as e:
			print(f"Error saving game result: {e}")
			return None

	@staticmethod
	def declare_winner(room_id, winner_id, role):
		game = GameManager.games.get(room_id)
		if not game: 
			return
		# here goes saving score 
		# Prepare player data
		players = {
			"player1": game["players"].get("player1", {}).get("id"),
			"alias1": game["players"].get("player1", {}).get("alias", "Guest"),
			"player2": game["players"].get("player2", {}).get("id"),
			"alias2": game["players"].get("player2", {}).get("alias", "Guest"),
		}

		Game = get_game_model()

		# Save the game result
		saved_game = GameManager.save_game_result(room_id, winner_id, game["scores"], players)

		if saved_game:
			logger.info(f"Game saved successfully: {saved_game}")

		logger.info(f"Player {winner_id} wins in room {room_id}!")
		return {
			"type": "endgame",
			"wait": 1,
			"winnerId": winner_id,
			"loserRole": role,
			"scores": game["scores"]
		}
	

	@staticmethod
	def cancel_disconnect_task(room_id):
		task = GameManager.disconnect_tasks.get(room_id)
		if task:
			task.cancel()
			del GameManager.disconnect_tasks[room_id]

	@staticmethod
	async def start_disconnect_countdown(room_id, remaining_player_id, role):
		async def countdown():
			try:
				await asyncio.sleep(COUNTDOWN)
				msg = GameManager.declare_winner(room_id, remaining_player_id, role)
				logger.info(f"\033[1;34m{msg}\033[0;m");
				return msg
			except asyncio.CancelledError:
				logger.info(f"Disconnect countdown cancelled for room {room_id}")
				return None
		if room_id in GameManager.disconnect_tasks:
			logger.warning(f"Countdown task already exists for room {room_id}. Overwriting previous task.")
		task = asyncio.create_task(countdown())
		GameManager.disconnect_tasks[room_id] = task
		result = await task
		return result

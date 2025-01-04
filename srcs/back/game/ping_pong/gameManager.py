from collections import defaultdict
import logging
import asyncio

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

		if len(game["players"]) >= 2:  # Max 2 players
			return None  # Room is full

		role = "player1" if "player1" not in game["players"] else "player2"
		game["players"][role] = {"id": player_id, "y": 0}  # Initial paddle position
		return role

	@staticmethod
	def leaveRoom(room_id, player_id):
		game = GameManager.games.get(room_id)
		if not game:
			return

		for role, player in list(game["players"].items()):  # Safely iterate
			if player["id"] == player_id:
				del game["players"][role]
				logger.info(f"Player {role} left room {room_id}.")
				break

		if not game["players"]:  # Delete room if empty
			del GameManager.games[room_id]
			logger.info(f"Room {room_id} has been deleted.")

	@staticmethod
	def updatePaddlePos(game, player_num, position):
		if player_num in game["players"]:
			game["players"][player_num]["y"] = position

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
	def handleMessage(room_id, player_num, data):
		game = GameManager.games.get(room_id)
		if not game:
			return {"type": "error", "message": "Game not found"}

		if data["type"] == "paddleMove":
			GameManager.updatePaddlePos(game, player_num, data["position"])

		return {
			"type": "update",
			"ball": game["ball"],
			"scores": game["scores"],
			"players": {
				role: {"y": player["y"]} for role, player in game["players"].items()
			},
		}

	@staticmethod
	def declare_winner(room_id, winner_id, role):
		game = GameManager.games.get(room_id)
		if not game:
			return
	
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

	#@staticmethod
	#def start_disconnect_countdown(room_id, remaining_player_id, role):
	#	async def countdown():
	#		logger.info(f"Starting disconnect countdown for room {room_id}.")
	#		try:
	#			logger.info(f"Countdown started for room {room_id}. Waiting 10 seconds.")
	#			await asyncio.sleep(10)  # Wait for 10 seconds
	#			logger.info(f"10 seconds passed for room {room_id}. Declaring winner.")
	#			
	#			winner_message = GameManager.declare_winner(room_id, remaining_player_id, role)
	#			if winner_message:
	#				await PongConsumer.channel_layer.group_send(
	#					room_id,
	#					{
	#						"type": "game_endgame",
	#						"message": winner_message
	#					}
	#				)
	#		except asyncio.CancelledError:
	#			logger.info(f"Disconnect countdown cancelled for room {room_id}.")
	#	
	#	# Check if a countdown is already running for the room
	#	if room_id in GameManager.disconnect_tasks:
	#		logger.warning(f"Countdown task already exists for room {room_id}. Overwriting previous task.")
	#	
	#	task = asyncio.create_task(countdown())
	#	GameManager.disconnect_tasks[room_id] = task
	
	@staticmethod
	async def start_disconnect_countdown(room_id, remaining_player_id, role):
		async def countdown():
			try:
				await asyncio.sleep(10)
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
		logger.info(f"leaving start disc. countdown with return None")
		return result

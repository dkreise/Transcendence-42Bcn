from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class GameManager:
    PADDLE_HEIGHT = 80
    BOARD_WIDTH = 800
    BOARD_HEIGHT = 500
    BALL_SPEED = 5

    # Store all games
    games = {}

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


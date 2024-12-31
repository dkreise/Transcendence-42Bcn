from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class GameManager:
    # Initialize games storage
    games = defaultdict(lambda: {
        "players": {}, 
        "ball": {
            "x": 300,
            "y": 200,
            "xspeed": 5,
            "yspeed": 5
        }, 
        "scores": {
            "player1": 0,
            "player2": 0
        }
    })

    @staticmethod
    def joinRoom(room_id, player_id):
        game = GameManager.games[room_id]
        
        if len(game["players"]) >= 2:
            logger.info(f"Room {room_id} is full.")
            return None  # Room is full

        role = "player1" if "player1" not in game["players"] else "player2" # Assigning role (player1 / player2)
        logger.info(f"Player {player_id} joined the room {room_id} as {role}!")
        game["players"][role] = {
			"username": player_id,
			"y": 250}  # Adding the new player to the game
        return role

    @staticmethod
    def leaveRoom(room_id, player_id):
        game = GameManager.games[room_id]

        for role, player in game["players"].items(): # Delete players from game
            if player["username"] == player_id:
                del game["players"][role]
                print(f"Player {player_id} left room {room_id}.")
                break

        if not game["players"]: # Delete room
            del GameManager.games[room_id]
            print(f"Room {room_id} has been deleted")

    @staticmethod
    def updatePaddlePos(game, player_num, position):
        for role, player in game["players"].items():
            #logger.info(f"updatePaddlePos: player_num \033[1;31m{player_num}\033[0m\n\t\tplayer[id] \033[1;32m{player['username']}\033[0m")
            if role == player_num:
                player["y"] = position
                #logger.info(f"Position: \033[1;33m{position}\033[0m updated in: \033[1;34m{player_num}\033[0m")
                return

    @staticmethod
    def updateBallPos(game):
        ball = game["ball"]
        ball["x"] += ball["xspeed"]
        ball["y"] += ball["yspeed"]

        players = game["players"]

        # Wall collisions
        if ball["y"] <= 0 or ball["y"] >= 500: #Board's height
            ball["xspeed"] *= -1
            #ball["yspeed"] *= -1
        # Paddles collisions
        if ball["x"] <= 10 or ball["y"] >= 790:
            ball["xspeed"] *= -1
            #ball["yspeed"] *= -1

        # Scores
        if ball["x"] <= 0:  # Left wall
            game["scores"]["player2"] += 1
            GameManager.resetBall(ball, direction=1)
        elif ball["x"] >= 600:  # Right wall
            game["scores"]["player1"] += 1
            GameManager.resetBall(ball, direction=-1)

    @staticmethod
    def resetBall(ball, direction):
        ball["x"], ball["y"] = 250, 200
        ball["xspeed"] *= direction

    @staticmethod
    def handleMessage(room_id, player_num, data):
        game = GameManager.games[room_id]

        if data["type"] == "paddleMove":
            #logger.info(f"player_id pre-update: {player_num}")
            GameManager.updatePaddlePos(game, player_num, data["position"])

        playerInfo = {
            role: {
                "y": player["y"]
            }
            for role, player in game["players"].items()
        }

        return {
            "type": "update",
            "ball": game["ball"],
            "scores": game["scores"],
            "players": playerInfo,
        }

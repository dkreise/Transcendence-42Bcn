from collections import defaultdict

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
            print(f"Room {room_id} is full.")
            return None  # Room is full

        role = "player1" if "player1" not in game["players"] else "player2" # Assigning role (player1 / player2)
        game["players"][role] = {"id": player_id, "y": 250}  # Adding the new player to the game
        print(f"Player {player_id} joined room {room_id} as {role}.")
        return role

    @staticmethod
    def leaveRoom(room_id, player_id):
        game = GameManager.games[room_id]

        for role, player in game["players"].items(): # Delete players from game
            if player["id"] == player_id:
                del game["players"][role]
                print(f"Player {player_id} left room {room_id}.")
                break

        if not game["players"]: # Delete room
            del GameManager.games[room_id]
            print(f"Room {room_id} has been deleted")

    #@staticmethod
    #def updatePaddlePos(game, player_id, position):
    #    for player in game["players"].values():
    #        if player["id"] == player_id:
    #            player["y"] = position
    #            return

    @staticmethod
    def updatePaddlePos(game, player_id, position):
        for role, player in game["players"].items():
            if player["id"] == player_id:
                player["y"] = position
                break


    @staticmethod
    def updateBallPos(game):
        ball = game["ball"]
        ball["x"] += ball["xspeed"]
        ball["y"] += ball["yspeed"]

        # Wall collisions
        if ball["y"] <= 0 or ball["y"] >= 500: #Board's height
            ball["yspeed"] *= -1

        # Scores
        if ball["x"] <= 0:  # Left wall
            game["scores"]["player2"] += 1
            GameManager.resetBall(ball, direction=1)
        elif ball["x"] >= 600:  # Right wall
            game["scores"]["player1"] += 1
            GameManager.resetBall(ball, direction=-1)

    @staticmethod
    def resetBall(ball, direction):
        ball["x"], ball["y"] = 300, 200
        ball["xspeed"] = 5 * direction
        ball["yspeed"] = 5

    @staticmethod
    def handleMessage(room_id, player_id, data):
        game = GameManager.games[room_id]

        if data["type"] == "paddleMove":
            GameManager.updatePaddlePos(game, player_id, data["position"])

        elif data["type"] == "ballPosition":
            GameManager.updateBallPos(game)

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

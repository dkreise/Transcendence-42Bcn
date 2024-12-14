from collections import defaultdict

class GameManager:
    games = defaultdict(lambda: {
        "players": {}, 
        "ball": {"x": 300, "y": 200, "xspeed": 5, "yspeed": 5}, 
        "scores": {"player1": 0, "player2": 0}
    })

    @staticmethod
    def join_room(room_id, player_id):
        game = GameManager.games[room_id]
        if len(game["players"]) >= 2:
            return None  # Room full

        print(f"Joining room {room_id} as player {player_id}")
        role = "player1" if "player1" not in game["players"] else "player2"
        game["players"][role] = {"id": player_id, "y": 0}  # Track paddle position
        return role

    @staticmethod
    def leave_room(room_id, player_id):
        game = GameManager.games[room_id]
        for role, player in game["players"].items():
            if player["id"] == player_id:
                del game["players"][role]
                break
        if not game["players"]:  # Cleanup empty rooms
            del GameManager.games[room_id]

    @staticmethod
    def handle_message(room_id, player_id, data):
        game = GameManager.games[room_id]

        if data["type"] == "paddleMove":
            for role, player in game["players"].items():
                if player["id"] == player_id:
                    player["y"] = data["position"]

        elif data["type"] == "ballPosition":
            ball = game["ball"]
            ball["x"] += ball["xspeed"]
            ball["y"] += ball["yspeed"]

            # Check collisions and scoring logic
            # (Update `ball["xspeed"]`, `ball["yspeed"]`, and scores as needed)

        return {
            "type": "update",
            "ball": game["ball"],
            "scores": game["scores"],
            "players": {role: {"y": player["y"]} for role, player in game["players"].items()},
        }

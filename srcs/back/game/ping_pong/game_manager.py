class GameManager:
    rooms = {}

    @classmethod
    def join_room(cls, room_id, player_id):
        if room_id not in cls.rooms:
            cls.rooms[room_id] = {"players": {}, "max_players": 2}

        room = cls.rooms[room_id]
        if player_id in room["players"]:
            return room["players"][player_id]["role"]  # Rejoining player

        if len(room["players"]) >= room["max_players"]:
            return None  # Room is full

        role = "player1" if "player1" not in [p["role"] for p in room["players"].values()] else "player2"
        room["players"][player_id] = {"role": role}
        return role

    @classmethod
    def leave_room(cls, room_id, player_id):
        if room_id in cls.rooms and player_id in cls.rooms[room_id]["players"]:
            del cls.rooms[room_id]["players"][player_id]
            if not cls.rooms[room_id]["players"]:
                del cls.rooms[room_id]

    @classmethod
    def handle_message(cls, room_id, data):
        # Add any server-side game state processing logic here
        pass

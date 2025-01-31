import os
import asyncio
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
from game.routing import websocket_urlpatterns
from ping_pong.gameManager import GameManager  # Import your GameManager class
from game.middleware import JwtAuthMiddlewareStack

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "game.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JwtAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})

# Define a function to start the background game loop
async def start_game_loop():
    async def update_game_state():
        while True:
            for room_id, game in GameManager.games.items():
                GameManager.updateBallPos(game)  # Update the ball's position on the server

                # Prepare game state update message
                player_positions = {
                    role: {"y": player["y"]}
                    for role, player in game["players"].items()
                }
                message = {
                    "type": "update",
                    "ball": game["ball"],
                    "scores": game["scores"],
                    "players": player_positions,
                }

                # Broadcast the updated state to all players in the room
                await PongConsumer.channel_layer.group_send(
                    room_id,
                    {"type": "broadcast", "message": message}
                )

            await asyncio.sleep(0.016)  # ~60 updates per second

    asyncio.create_task(update_game_state())

# Start the game loop when the ASGI application is initialized
asyncio.get_event_loop().call_soon(start_game_loop)

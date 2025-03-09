import asyncio

# Store active tournaments here so it's accessible by both consumers.py and views.py
active_tournaments = {}
active_tournaments_lock = asyncio.Lock()
active_games = {}
active_games_lock = asyncio.Lock()

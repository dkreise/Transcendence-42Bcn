from collections import defaultdict
from django.contrib.auth import get_user_model
from django.db import transaction
from channels.layers import get_channel_layer
import logging
import asyncio

logger = logging.getLogger(__name__)

'''
players
	L id	[string]	#player's username
	L alive	[bool]		# 0 = eliminated / 1 = still competing
'''

class TournamentManager:

	def __init__(self, tour_id):
		self.users = {} #list of usernames
		self.players = {}

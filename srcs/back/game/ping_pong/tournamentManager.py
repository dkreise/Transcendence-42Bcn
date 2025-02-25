from collections import defaultdict
from django.contrib.auth import get_user_model
from django.db import transaction
from channels.layers import get_channel_layer
import logging
import asyncio
from django.template.loader import render_to_string
import random
from game.utils.translations import add_language_context 
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

def get_game_model():
    from .models import Game  # Import inside function
    return Game

def get_tournament_model():
    from tournament.models import Tournament  # Absolute import from another app
    return Tournament

'''
players
	L id	[string]	#player's username
	L alive	[bool]		# 0 = eliminated / 1 = still competing
'''

class TournamentManager:

	def __init__(self, scope, tour_id, max_user_cnt):
		self.scope = scope
		self.id = tour_id
		self.max_user_cnt = max_user_cnt
		self.users = []         # list of all usernames
		self.players = []		# list of players in current round
		self.round = 0
		self.pairs = []
		self.winners = []
		self.quit_winners = 0
		self.test = 0
		self.finished = False

	def get_players_cnt(self):
		return len(self.players)
	
	def get_round_players_cnt(self):
		if (len(self.pairs) >= self.round):
			return len(self.pairs[self.round - 1]) * 2
		return -1

	def add_player(self, username):
		if username not in self.users:
			# self.users[username] = True  # True means the player is waiting
			# self.players[username] = {"alive": True}
			self.users.append(username)
			self.players.append(username)
		else:
			logger.info("user is already here!")
			return "reload"
		### only for testing:
		if self.get_players_cnt() == 1 and self.max_user_cnt == 2:
			self.test = 1
			self.max_user_cnt = 4
			self.users.append("@AI")
			self.players.append("@AI")
			self.users.append("@AI")
			self.players.append("@AI")
		return "connect"
		### end for testing
	
	def increase_round(self):
		self.round = self.round + 1
		self.create_pairs()

	def get_waiting_room_page(self):
		total_players = self.get_players_cnt()
		context = {
			'tournament_id': self.id,
			'player_count': total_players,
		}
		add_language_context(self.scope.get('request', {}), context)
		# add_language_context(self.scope.get('cookies', {}), context)
		html = render_to_string('waiting_room.html', context)
		page = {
			'html': html,
			'redirect': '/waiting-room',
		}
		return page

	def get_bracket_page(self, username):
		if self.get_players_cnt() == 1:
			return self.get_final_page()
		context = {
			'pairs': self.pairs,
			'bool_winners': self.get_bool_winners(),
			'pairs_and_winners': self.get_pairs_and_winners(self.pairs),
			'cur_round': self.round,
			'total_cnt': self.max_user_cnt,
		}
		logger.info(f"round:: {self.round}")
		add_language_context(self.scope.get('request', {}), context)
		if self.max_user_cnt <= 4:
			html = render_to_string('tournament_bracket4.html', context)
		else:
			html = render_to_string('tournament_bracket8.html')

		needs_to_play = username in self.players
		opponent = self.get_opponent(username)
		if needs_to_play:
			is_winner = len(self.winners) >= self.round and username in self.winners[self.round - 1]
			if is_winner:
				needs_to_play = False
		page = {
			'html': html,
			'redirect': '/tournament-bracket',
			'status': 'playing',
			'needs_to_play': needs_to_play,
			'opponent': opponent,
		}
		return page

	def get_final_page(self):
		self.finished = True
		context = {
			"winner_player": self.players[0]
		}
		add_language_context(self.scope.get('request', {}), context)
		html = render_to_string('final_tournament_page.html', context)
		
		page = {
			'html': html,
			'status': 'finished',
		}
		return page

	def handle_tournament_start(self, username): # or new round..?
		# self.create_pairs()
		needs_to_play = username in self.players
		opponent = self.get_opponent(username)

		# if opponent != "@AI" => handle remote game join..

		return {'needs_to_play': needs_to_play, 'opponent': opponent}

	def create_pairs(self):
		cnt = self.get_players_cnt()
		if cnt % 2 == 1:
			self.players.append("@AI")
			cnt += 1

		random.shuffle(self.players)
		cur_pairs = [[self.players[i], self.players[i + 1]] for i in range(0, cnt - 1, 2)]

		if self.test == 1:
			self.test = 0
			for i in range(0, 2):
				if cur_pairs[i][0] != "@AI" and cur_pairs[i][1] != "@AI":
					real = cur_pairs[i][0]
					cur_pairs[i][0] = "@AI"
					if i == 0:
						cur_pairs[1][0] = real
					else:
						cur_pairs[0][0] = real
					break
		
		self.pairs.append(cur_pairs)
		logger.info(self.pairs)

	async def handle_game_end(self, data):
		logger.info("Handling game end")
		winner = data["winner"]
		winner_score = data["winner_score"]
		loser = data["loser"]
		loser_score = data["loser_score"]

		await self.save_game_result(winner, winner_score, loser, loser_score)
		await self.save_tournament_result(loser, False, False)

		if loser in self.players:
			logger.info("removing loser from players")
			self.players.remove(loser)

		if len(self.winners) < self.round:
			self.winners.append([winner])
		else:
			self.winners[self.round - 1].append(winner)

		logger.info(f"players now: {self.players}")
		logger.info(f"winners now: {self.winners}")
		cnt = self.get_players_cnt() + self.quit_winners
		round_player_cnt = self.get_round_players_cnt()
		logger.info(f"cnt: {cnt}, round cnt: {round_player_cnt}")

		if (self.get_players_cnt() == 1):
			# means that tournament finished
			logger.info("tournament finished")
			await self.save_tournament_result(winner, True, False)
			return 'finished'
		elif (cnt * 2 == round_player_cnt):
			# means that round finished
			logger.info("round finished")
			return 'new'
		else:
			logger.info("waiting for round to finish")
			return 'waiting'
	
	@sync_to_async
	def save_game_result(self, winner, win_score, loser, los_score):
		logger.info("Saving game result")
		try:
			Game = get_game_model()
			with transaction.atomic(): #Ensure atomicity (?)
				player1 = self.get_user(winner)
				player2 = self.get_user(loser)
				score1 = win_score
				score2 = los_score

				# Save the game result
				game = Game.objects.create(
					player1=player1,
					score_player1=score1,
					player2=player2,
					score_player2=score2,
					winner=player1,
					tournament_id=self.id,
				)
				game.save()

				# return game #return the saved game instance

		except Exception as e:
			logger.info(f"Error saving game result: {e}")
			# return None
	
	@sync_to_async
	def save_tournament_result(self, player, winner, quit_winner):
		logger.info("Saving tournament result")
		try:
			Tournament = get_tournament_model()
			with transaction.atomic(): #Ensure atomicity (?)
				user = self.get_user(player)
				score = self.round - 1
				if winner or quit_winner:
					score += 1

				logger.info(f"res for user: {player}, score: {score}")
				# Save the tournament result
				tournament_res = Tournament.objects.create(
					id_tournament=self.id,
					player=user,
					score=score
				)
				tournament_res.save()

		except Exception as e:
			logger.info(f"Error saving tournament result: {e}")

	async def handle_quit(self, username):
		logger.info(f"{username} wants to quit!!!")
		if username not in self.players or self.finished:
			self.users.remove(username)
			return
		if self.round == 0:
			logger.info("tournament has not started")
			# we need to delete from players and users
			if username in self.players:
				self.players.remove(username)
			if username in self.users:
				self.users.remove(username)
			return 'not started'
		else:
			logger.info("tournament has started")
			# check if has finished game in cur round
			# if not needs to play => just disconnect (already saved everything and removed)
			# if is a winner => quit_winners++, save to tournmt table, check for tournmt end
			# if game has not finished => force him as loser (handle_game_result)
			is_winner = len(self.winners) >= self.round and username in self.winners[self.round - 1]
			logger.info(f"is winner: {is_winner}")
			if is_winner:
				self.quit_winners += 1 # mutexx it.. ?
				await self.save_tournament_result(username, False, True)
				self.players.remove(username)
				self.users.remove(username)
			else:
				opponent = self.get_opponent(username)
				data = {'winner': opponent, 'loser': username, 'winner_score': 0, 'loser_score': 0}
				status = await self.handle_game_end(data)
				self.users.remove(username)
				return status

			if (self.get_players_cnt() == 1):
				logger.info("tournament finished")
				await self.save_tournament_result(self.players[0], True, False)
				return 'finished'
			else:
				return 'continue'

	def get_user(self, name):
		User = get_user_model()
		if (name == "@AI"):
			try:
				user = User.objects.get(username=name)
			except User.DoesNotExist:
				user = User.objects.create(username=name, password="AIplayer1234")
				user.save()
			return user
		else:
			return User.objects.get(username=name)

	def needs_to_play_this_round(self, username):
		needs_to_play = username in self.players
		opponent = None
		cur_pairs = self.pairs[self.round - 1]

		if not needs_to_play:
			return False # user maybe has played and lost

		# else: user needs to play or won
		for pair in cur_pairs:
			if username in pair:
				if pair[0] == username:
					opponent = pair[1]
				else:
					opponent = pair[0]
				break

		if opponent in self.players:
			# the pair hasn't played yet
			return True
		else:
			return False # user won
	
	def get_opponent(self, username):
		needs_to_play = username in self.players
		opponent = None
		cur_pairs = self.pairs[self.round - 1]

		if (needs_to_play):
			for pair in cur_pairs:
				if username in pair:
					if pair[0] == username:
						opponent = pair[1]
					else:
						opponent = pair[0]
					break
		return opponent
	
	def get_bool_winners(self):
		bool_winners = []
		for i in range(self.round):
			cur_winners = []
			for pair in self.pairs[i]:
				if len(self.winners) > i:
					if pair[0] in self.winners[i]:
						cur_winners.append([True, False])
					elif pair[1] in self.winners[i]:
						cur_winners.append([False, True])
					else:
						cur_winners.append([False, False])
				else:
					cur_winners.append([False, False])
			bool_winners.append(cur_winners)
		logger.info(f"bool_winners: {bool_winners}")
		return bool_winners

	def get_pairs_and_winners(self, pairs):
		pairs_and_winners = []
		bool_winners = self.get_bool_winners()
		for round_idx in range(self.round):
			round_matches = []
			for pair, winner in zip(pairs[round_idx], bool_winners[round_idx]):
				round_matches.append((pair, winner))  # Pair contains player names, winner contains (True, False)
			pairs_and_winners.append(round_matches)
		return pairs_and_winners

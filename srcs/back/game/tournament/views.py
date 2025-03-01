from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Tournament
import random
from django.db.models import Q, Avg
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.template.loader import render_to_string
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
# from .models import Profile
from game.utils.translations import add_language_context
from rest_framework import status
import json
import requests
from django.conf import settings
import re
from django.shortcuts import get_object_or_404
from django.utils.translation import activate
from django.contrib.auth.decorators import login_required
from django.urls import path, include
import redis
from django.core.cache import cache 

@api_view(['GET'])
def get_player_tournament_statistics(request, player_id):
    tournaments_played = Tournament.objects.filter(player_id=player_id).count()
    tournament_score = Tournament.objects.filter(player_id=player_id).aggregate(
        avg_score=Avg('score')
    )
    tournament_score = tournament_score['avg_score'] or 0

    return Response({
        'tournaments_played': tournaments_played,
        'tournament_score': tournament_score,
    })

@api_view(['GET'])
def tournament_home_page(request):
    context = {}
    add_language_context(request, context)
    tournament_home_page_html = render_to_string('tournament_home_page.html', context)
    return JsonResponse({'tournament_home_page_html': tournament_home_page_html}, content_type="application/json")

def get_next_tournament_id():
    last_id = cache.get("last_tournament_id")  # Fetch from Redis
    if last_id is None:
        last_id = 0
    next_id = last_id + 1
    cache.set("last_tournament_id", next_id, timeout=None)  # TODO: take from the database or REDIS!! i dont know the last tournament_id
    return f"{next_id:04d}"

@api_view(['GET'])
def tournament_creator(request):
    username = request.user.username
    tournament_id = get_next_tournament_id()
    print("TOURNAMENT ID::")
    print(tournament_id)
    players = [username]
    # scores = {}

    tournament_data = {
        "tournament_id": tournament_id,
        "user_creator": username,
        "players": players,
        "status": "waiting",
        "round": 1,
        "round_players_cnt": 1,
        "pairs": [],
        "matches": [],
        # "score": score,
        #"rounds": [[user1 : user2][user3: use3]]] [[user2 : user3]] [round3]
    }
    print("PLAYERS::")
    print(players)
    
    cache.set(f"tournament:{tournament_id}", tournament_data, timeout=3600)
    return JsonResponse({
        "success": True,
        "message": "Tournament created",
        "tournament_id": tournament_id
    }, content_type="application/json")


@api_view(['GET'])
def get_players_count(request, tournament_id):
    tournament_data = cache.get(f"tournament:{tournament_id}")
    if not tournament_data:
        return JsonResponse({'error': 'Tournament not found in cache'}, status=404)

    players_count = len(tournament_data["players"])

    return JsonResponse({'players_count': players_count})

@api_view(['GET'])
def get_tournament_data(request, tournament_id):
    tournament_data = cache.get(f"tournament:{tournament_id}")

    if not tournament_data:
        return JsonResponse({'error': 'Tournament not found in cache'}, status=404)

    return JsonResponse(tournament_data)


# def get_tournament_status(request):
#     tournament_id = request.GET.get("id")
#     status = redis_client.get(f"tournament:{tournament_id}")  # Fetch from Redis

#     if status:
#         return JsonResponse({"status": status})
#     return JsonResponse({"error": "Tournament not found"}, status=404)

@api_view(['GET'])
def join_tournament_page(request):
    context = {}
    add_language_context(request, context)
    join_tournament_html = render_to_string('join_tournament.html', context)
    return JsonResponse({'join_tournament_html': join_tournament_html}, content_type="application/json")

@api_view(['POST'])
def join_tournament(request, tournament_id):
    tournament_data = cache.get(f"tournament:{tournament_id}")
    if not tournament_data:
        return JsonResponse({'error': 'Tournament not found'}, status=404) #TODO: add alert in the front
    
    # Add the user (player) to the tournament's player list
    user = request.user.username
    if user not in tournament_data["players"]:
        tournament_data["players"].append(user)
        tournament_data["round_players_cnt"] += 1
    
    # Save the updated data back into the cache, set a new expiry (1 hour)
    cache.set(f"tournament:{tournament_id}", tournament_data, timeout=3600)
    return JsonResponse({'success': True, 'message': 'Successfully joined the tournament'})

@api_view(['GET'])
def waiting_room_page(request, tournament_id):
    print('waiting roooooom')
    print(tournament_id)
    tournament_data = cache.get(f"tournament:{tournament_id}")

    if not tournament_data:
        return JsonResponse({'error': 'Tournament not found'}, status=404)
    
    context = {
        'tournament_id': tournament_id,
        'player_count': len(tournament_data['players']),  # Corrected: access players as a dictionary key
    }
    add_language_context(request, context)
    waiting_room_html = render_to_string('waiting_room.html', context)
    
    user = request.user.username
    if "user_creator" in tournament_data and user == tournament_data["user_creator"]:
        waiting_room_creator_button = render_to_string('waiting_room_creator_button.html', context)
        waiting_room_html += waiting_room_creator_button
    
    return JsonResponse({
        'waiting_room_html': waiting_room_html,
        "tournament_id": tournament_id
    }, content_type="application/json")

def start_round(tournament_id):
    tournament_data = cache.get(f"tournament:{tournament_id}")
    player_cnt = tournament_data["round_player_cnt"]
    if (player_cnt % 2 == 1):
        player_cnt += 1

    if (player_cnt == 4 or player_cnt == 8):
        tournament_data["round_player_cnt"] = player_cnt
        tournament_data["status"] = "ready"
        tournament_data["pairs"].append(create_pairs(tournament_id))

    cache.set(f"tournament:{tournament_id}", tournament_data, timeout=3600)

@api_view(['GET'])
def tournament_bracket_page(request, tournament_id):
    tournament_data = cache.get(f"tournament:{tournament_id}")
    
    if tournament_data:
        # if tournament_data["status"] == "waiting":
        #     tournament_data["status"]
        players = tournament_data["players"]
        players_count = len(players)
        print("PLAYER COUNT::")
        print(players_count)

        pairs = create_pairs(tournament_id)

        username = request.user.username
        needs_to_play = username in players
        print("USER NEEDS TO PLAY::")
        print(needs_to_play)
        opponent = None
        if (needs_to_play):
            for pair in pairs:
                if username in pair:
                    if pair[0] == username:
                        opponent = pair[1]
                    else:
                        opponent = pair[0]
                    break
        print("OPPONENT::")
        print(opponent)

        # Add tournament data to context
        context = {
            "tournament_id": tournament_id,
        }

        add_language_context(request, context)

        # Render the correct template based on player count
        # # if player_count == 4:
        #     tournament_bracket_html = render_to_string("tournament_bracket4.html", context)
        # elif player_count == 8:
        tournament_bracket_html = render_to_string("tournament_bracket8.html", context)
        # else:
        #     return JsonResponse({"error": "Invalid player count"}, status=400)

        return JsonResponse({"tournament_bracket_html": tournament_bracket_html, "needs_to_play": needs_to_play, "opponent": opponent}, content_type="application/json")
    
    return JsonResponse({"error": "Tournament not found"}, status=404)

def create_pairs(tournament_id):
    tournament_data = cache.get(f"tournament:{tournament_id}")
    players = tournament_data["players"]
    cnt = len(players)
    random.shuffle(players)
    pairs = [(players[i], players[i + 1]) for i in range(0, cnt - 1, 2)]

    # handle odd cnt: (to add ai?)
    if cnt % 2 == 1:
        pairs.append((players[-1], "@AI"))
    
    print(pairs)

    return pairs

@api_view(['POST'])
def save_tournament_game_result(request, tournament_id):
    winner = request.data.get("winner")
    looser = request.data.get("looser")
    tournament_data = cache.get(f"tournament:{tournament_id}")
    players = tournament_data["players"]
    print("winner:: " + winner)
    print("looser:: " + looser)
    if winner in players:
        players.remove(winner)
    if looser in players:
        players.remove(looser)
    tournament_data["players"] = players

    # save data to tournament table for looser

    # save data to game table for both (if not ai??)

    tournament_data["matches"].append({"round": tournament_data["round"], "winner": winner})
    round_winners = [match["winner"] for match in tournament_data["matches"] if match["round"] == tournament_data["round"]]

    if len(round_winners) == tournament_data["round_players_cnt"] // 2:
        tournament_data["round"] += 1
        tournament_data["players"] = round_winners
        tournament_data["status"] = "ready"
        cache.set(f"tournament:{tournament_id}", tournament_data, timeout=3600)

        return JsonResponse({"success": True, "new_round": True})
        
    cache.set(f"tournament:{tournament_id}", tournament_data, timeout=3600)
    return JsonResponse({"success": True, "new_round": False})


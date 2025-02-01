from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Tournament
import random
from django.db.models import Q, Avg

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
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Tournament
import random
from django.db.models import Q, Avg
from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
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
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import activate
from django.contrib.auth.decorators import login_required
from django.urls import path, include
import redis
from django.http import JsonResponse
from .models import Tournament
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
    user = request.user
    id_tournament = get_next_tournament_id()
    players_list = [user.username]

    tournament_data = {
        "id_tournament": id_tournament,
        "players": players_list,
        "player_count": len(players_list),
        "status": "waiting",
    }
    
    cache.set(f"tournament:{id_tournament}", tournament_data, timeout=3600)

    context = {
        'tournament_id': id_tournament,
        'player_count': len(players_list),
    }
    add_language_context(request, context)
    tournament_creator_html = render_to_string('tournament_creator.html', context)

    return JsonResponse({
        'tournament_creator_html': tournament_creator_html,
        "message": "Tournament created",
        "id": id_tournament
    }, content_type="application/json")


@api_view(['GET'])
def get_players_count(request, tournament_id):
    
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        players_count = len(tournament.players)  # Assuming 'players' is a list or related model field

        return JsonResponse({
            'player_count': players_count,
        })
    except Tournament.DoesNotExist:
        return JsonResponse({'error': 'Tournament not found'}, status=404)

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
def join_tournament(request):

    # Get the tournament_id and player_count from the request
    tournament_id = request.data.get('tournament_id')
    player_count = request.data.get('player_count')

    if not tournament_id:
        return JsonResponse({'error': 'Tournament ID is required'}, status=400)

    # Check if the tournament exists in the cache
    tournament_data = cache.get(f"tournament:{tournament_id}")

    if not tournament_data:
        return JsonResponse({'error': 'Tournament not found'}, status=404)
    
    # Check if there is a player list, if not, initialize it
    players = json.loads(tournament_data.get('players', '[]'))
    # Add the user (player) to the tournament's player list
    user = request.user.username  # assuming the username is the player identifier
    if user not in players:
        players.append(user)
    
    # Update the tournament data with the new player list
    tournament_data['players'] = json.dumps(players)
    
    # Save the updated data back into the cache, set a new expiry (1 hour)
    cache.set(f"tournament:{id_tournament}", tournament_data, timeout=3600)


    # Respond with success
    return JsonResponse({'success': True, 'message': 'Successfully joined the tournament'})


@api_view(['GET'])
def tournament_bracket_page(request, tournament_id):
    tournament_data = cache.get(f"tournament:{tournament_id}")
    
    if tournament_data:
        player_count = tournament_data.get("player_count", 0)

        # Add tournament data to context
        context = {
            "tournament_id": tournament_id,
            "players": tournament_data.get("players", []),
            "player_count": player_count,
        }

        add_language_context(request, context)

        # Render the correct template based on player count
        if player_count == 4:
            tournament_bracket_html = render_to_string("tournament_bracket4.html", context)
        elif player_count == 8:
            tournament_bracket_html = render_to_string("tournament_bracket8.html", context)
        else:
            return JsonResponse({"error": "Invalid player count"}, status=400)

        return JsonResponse({"tournament_bracket_html": tournament_bracket_html}, content_type="application/json")
    
    return JsonResponse({"error": "Tournament not found"}, status=404)

from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework.decorators import api_view
from .models import Game
from .serializers import PlayerSerializer, GameSerializer
# from django.contrib.auth.models import User
import random
from django.db.models import Q
from game.utils.translations import add_language_context
from django.utils.translation import activate
from django.template.loader import render_to_string
from django.http import JsonResponse
from .websocket_state import active_tournaments, active_tournaments_lock, active_games, active_games_lock
import asyncio
from asgiref.sync import sync_to_async
from django.contrib.auth.decorators import login_required

@api_view(['GET'])
@login_required
def get_player_game_statistics(request, player_id):
    print("GAME stats request: ", request)
    games_played = Game.objects.filter(Q(player1_id=player_id) | Q(player2_id=player_id)).count()
    games_won = Game.objects.filter(winner_id=player_id).count()

    return Response({
        'games_played': games_played,
        'games_won': games_won
    })

@api_view(['GET'])
@login_required
def get_player_last_ten_games(request, player_id):
    try:
        games = (
            Game.objects.filter(Q(player1_id=player_id) | Q(player2_id=player_id))
            .order_by('-id')[:10]
        )[::-1]

        games_data = [
            {
                "id": game.id,
                "player1": game.player1.username if game.player1 else "Unknown",
                "score_player1": game.score_player1,
                "player2": game.player2.username if game.player2 else "Unknown",
                "score_player2": game.score_player2,
                "winner": game.winner.username if game.winner else "Draw", #?
                "tournament_id": game.tournament_id,
            }
            for game in games
        ]

        return Response(games_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": f"An unexpected error ocurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@login_required
def get_player_all_games(request, player_id):
    try:
        games = (
            Game.objects.filter(Q(player1_id=player_id) | Q(player2_id=player_id))
            .order_by('-id')
        )
        # print("GAMES OBJECTS:::")
        # print(games)
        games_data = [
            {
                "id": game.id,
                "date": game.date.strftime("%Y-%m-%d %H:%M"),
                "player1": game.player1.username if game.player1 else "Unknown",
                "score_player1": game.score_player1,
                "player2": game.player2.username if game.player2 else "Unknown",
                "score_player2": game.score_player2,
                "winner": game.winner.username if game.winner else "Draw", #?
                "tournament_id": game.tournament_id,
            }
            for game in games
        ]
        # print(games_data)

        return Response(games_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": f"An unexpected error ocurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@login_required
def get_difficulty_level(request):
    print("we are inside")
    if request.user:
        context = {
            'user': request.user,
        }
        add_language_context(request.COOKIES, context)
        get_difficulty_html = render_to_string('get_difficulty.html', context)
        return JsonResponse({'get_difficulty_html': get_difficulty_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'user not authenticated'})

@api_view(['GET'])
@login_required
def play_game(request):
    context = {
        'user': request.user,
    }
    add_language_context(request.COOKIES, context)
    game_html = render_to_string('remote_game.html', context)
    #game_html = render_to_string('remote_home.html', context)
    return JsonResponse({'game_html': game_html}, content_type="application/json")
    # add_language_context(request.COOKIES, context)
    # game_html = render_to_string('remote_game.html', context)
    # return JsonResponse({'game_html': game_html}, content_type="application/json")

@api_view(['GET'])
@login_required
def remote_home(request):
    context = {
        'user': request.user,
    }
    add_language_context(request.COOKIES, context)
    game_html = render_to_string('remote_home.html', context)
    return JsonResponse({'game_html': game_html}, content_type="application/json")

@api_view(["GET"])
def check_remote(request, room_id):
	is_active = room_id in active_games
	print(f"game already exists? {is_active}")
	return JsonResponse({"active": is_active})

@api_view(["GET"])
def check_tournament_id(request, tour_id):
    print(f"TOUR ID:: {tour_id}")
    # with active_tournaments_lock:
    is_active = tour_id in active_tournaments
    print(f"IS ACTIVE? {is_active}")
    return JsonResponse({"active": is_active})

@api_view(['GET'])
@login_required
def get_username(request):
    return JsonResponse({'status': 'success', 'username': request.user.username}, status=200)

@api_view(['GET'])
@login_required
def get_game_dict(request):
    context = {}
    add_language_context(request.COOKIES, context)
    return JsonResponse({'dict': context})

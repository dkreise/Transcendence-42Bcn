from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from .models import Game
from .serializers import PlayerSerializer, GameSerializer
from django.contrib.auth.models import User, AnonymousUser
import random
from django.db.models import Q
from game.utils.translations import add_language_context 
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.template.loader import render_to_string
import logging
import json
import requests
from django.conf import settings
import re
from django.shortcuts import get_object_or_404
from django.utils.translation import activate
from django.contrib.auth.decorators import login_required

logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_second_name(request):
    print("In get second name headers: ", request.headers)
    print("In get second name api: ", request.user)
    if request.user:
        context = {
            'user': request.user,
        }
        add_language_context(request, context)
        get_second_name_html = render_to_string('get_name.html', context)
        return JsonResponse({'get_name_html': get_second_name_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'user not authenticated'}, status=402)

@api_view(['POST'])
def play_game(request):
    print("In play game: ", request.user)
    print("In play game, request: ", request.data)
    second_player = request.data.get('second-player')
    if not request.user:
        return JsonResponse({'error': 'User not authenticated'}, status=402)
    elif not second_player:
        return JsonResponse({'error': 'No second player'}, status=403)
    
    context = {
        'user': request.user,
        # 'player1': request.user.username,
        # 'player2': second_player,    
    }
    resp = {
        'main_user': 1,
        'player1': request.user.username,
        'player2': second_player,
    }

    if random.randint(1, 2) == 1:
        # context['player1'] = second_player
        # context['player2'] = request.user.username
        resp['player1'] = second_player
        resp['player2'] = request.user.username
        resp['main_user'] = 2
    
    # resp['player1'] = context['player1']
    # resp['player2'] = context['player2']
    add_language_context(request, context)
    game_html = render_to_string('local_game.html', context)
    resp['game_html'] = game_html
    resp['Content-Type'] = 'application/json'
    return JsonResponse(resp)

def guest_player(name):
    
    guest = "@guest"

    try:
        user = User.objects.get(username=name)
    except User.DoesNotExist:
        user = User.objects.create(username=guest, password="guest")
        user.save()
    return user


@api_view(['POST'])
def save_local_score(request):
    try:
        # Extract data from request
        main_user = request.data.get('main_user')
        # player1_name = request.data.get('player1')
        # player2_name = request.data.get('player2')
        score1 = request.data.get('score1')
        score2 = request.data.get('score2')

        player1 = request.user if main_user == 1 else guest_player("@guest")
        player2 = request.user if main_user == 2 else guest_player("@guest")

        if not user1 or not user2:
            raise ValueError("Couldn't find the player")

        # Determine the winner
        winner = user1 if score1 > score2 else user2

        # Save to the database
        game = Game.objects.create(
            player1=player1,
            score_player1=score1,
            player2=player2,
            score_player2=score2,
            winner=winner
        )
        game.save()
        
        return Response({"status": "success"})
    except Exception as error:
        print("Error in save score: ", error)
        return Response({"status": "failure", "error": str(error)}, status=501)
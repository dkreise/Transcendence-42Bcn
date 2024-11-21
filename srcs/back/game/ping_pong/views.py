from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Game
from .serializers import PlayerSerializer, GameSerializer
from django.contrib.auth.models import User
import random

# Create your views here.

@api_view(['GET'])
def player_list(request):
    players = User.objects.all()  # Get all players from the database
    serializer = PlayerSerializer(players, many=True)  # Serialize the players
    return Response(serializer.data)  # Return the serialized data in the response

@api_view(['GET'])
def score_list(request):
    scores = Game.objects.all()  # Get all players from the database
    serializer = GameSerializer(scores, many=True)  # Serialize the players
    return Response(serializer.data)  # Return the serialized data in the response

def game_button(request):
    return render(request, 'game.html')

@api_view(['GET'])
def get_current_players(request):
    try:
        # Fetch all users
        users = list(User.objects.all())
        
        # Ensure there are at least two users
        if len(users) < 2:
            return Response({"error": "Not enough players available"}, status=400)

        # Randomly select two different players
        player1, player2 = random.sample(users, 2)

        return Response({
            "name1": player1.username,
            "name2": player2.username
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def send_score(request):
    try:
        # Extract data from request
        player1_name = request.data.get('player1')
        player2_name = request.data.get('player2')
        score1 = request.data.get('score1')
        score2 = request.data.get('score2')

        # Validate players
        player1 = User.objects.filter(username=player1_name).first() if score1 > score2 else User.objects.filter(username=player2_name).first() #if score2 > score1
        player2 = User.objects.filter(username=player2_name).first() if score1 > score2 else User.objects.filter(username=player1_name).first() #if score2 > score1

        if not player1 or not player2:
            return Response({"status": "failure"}, status=400)

        # Determine the winner
        winner = player1 if score1 > score2 else player2 #if score2 > score1 else None

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
    except Exception:
        return Response({"status": "failure"}, status=500)

def winner_page(request):
    return render(request, 'winner.html')
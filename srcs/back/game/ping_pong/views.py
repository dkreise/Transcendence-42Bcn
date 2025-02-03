from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
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
# from django.db import transaction
# from django.contrib.auth import get_user_model

# User = get_user_model()
 
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

@api_view(['GET'])
def get_player_game_statistics(request, player_id):
    print("GAME stats request: ", request)
    games_played = Game.objects.filter(Q(player1_id=player_id) | Q(player2_id=player_id)).count()
    games_won = Game.objects.filter(winner_id=player_id).count()

    return Response({
        'games_played': games_played,
        'games_won': games_won
    })

@api_view(['GET'])
def get_player_last_ten_games(request, player_id):
    try:
        games = (
            Game.objects.filter(Q(player1_id=player_id) | Q(player2_id=player_id))
            .order_by('id')[:10]
        )

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
def get_player_all_games(request, player_id):
    try:
        games = (
            Game.objects.filter(Q(player1_id=player_id) | Q(player2_id=player_id))
            .order_by('id')
        )

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

        return Response(games_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": f"An unexpected error ocurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def play_game(request):
    context = {
        'user': request.user,
    }
    add_language_context(request, context)
    game_html = render_to_string('remote_game.html', context)
    return JsonResponse({'game_html': game_html}, content_type="application/json")

def save_remote_score(room_id, winner_id, scores, players):
    """
    Save the game result in the database while preventing race conditions.
    
    :param room_id: ID of the game room.
    :param winner_id: The ID of the winning player.
    :param scores: Dictionary containing scores for player1 and player2.
    :param players: Dictionary containing player IDs and aliases.
    """
    try:
        with transaction.atomic():  # Ensure atomicity
            player1_id = players.get("player1")
            player2_id = players.get("player2")

            # Fetch users (set to None if they don't exist)
            # player1 = User.objects.filter(id=player1_id).first()
            # player2 = User.objects.filter(id=player2_id).first()
            winner = User.objects.filter(id=winner_id).first()
            player1 = winner
            player2 = User.objects.filter(id=player1_id).first() if player1_id == winner_id else User.objects.filter(id=player2_id).first()
            score1 = scores["player1"] if scores["player1"] > scores["player2"] else scores["player2"]
            score2 = scores["player1"] if scores["player1"] < scores["player2"] else scores["player2"]
            # Save the game result
            game = Game.objects.create(
                player1=player1,
                # alias1=players.get("alias1", "Guest" if not player1 else player1.username),
                score_player1=score1,
                player2=player2,
                # alias2=players.get("alias2", "Guest" if not player2 else player2.username),
                score_player2=score2,
                winner=winner,
                tournament_id=-1  # Set tournament_id accordingly if needed
            )
            game.save()

            return game  # Return the saved game instance

    except Exception as e:
        print(f"Error saving game result: {e}")
        return None
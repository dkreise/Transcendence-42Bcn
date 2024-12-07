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

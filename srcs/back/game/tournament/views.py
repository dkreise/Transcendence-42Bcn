from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Tournament
from django.db.models import Sum
from django.http import JsonResponse
from game.utils.translations import add_language_context
from django.shortcuts import get_object_or_404
from django.utils.translation import activate
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string

@api_view(['GET'])
@login_required
def get_player_tournament_statistics(request, player_id):
    tournaments_played = Tournament.objects.filter(player_id=player_id).count()
    tournament_score = Tournament.objects.filter(player_id=player_id).aggregate(
        sum_score=Sum('score')
    )
    tournament_score = tournament_score['sum_score'] or 0

    return Response({
        'tournaments_played': tournaments_played,
        'tournament_score': tournament_score,
    })

@api_view(['GET'])
@login_required
def tournament_home_page(request):
    context = {}
    add_language_context(request.COOKIES, context)
    tournament_home_page_html = render_to_string('tournament_home_page.html', context)
    return JsonResponse({'tournament_home_page_html': tournament_home_page_html}, content_type="application/json")

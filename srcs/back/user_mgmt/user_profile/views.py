from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.contrib.auth import authenticate, login
from django.template.loader import render_to_string
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from rest_framework import status
import json
import requests

@api_view(['GET'])
def user_info_api(request):
    if request.user.is_authenticated:
        context = {
            'user': request.user,  # Pass the user object to the template
        }
        # Render the HTML with the user's data
        user_html = render_to_string('user.html', context)
        return JsonResponse({'user_html': user_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'user not authenticated'}, status=401)

def player_game_statistics(player_id):
    game_service_url = 'http://game:8001'
    endpoint = f'{game_service_url}/api/player/{player_id}/game_statistics/'

    try:
        response = requests.get(endpoint)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching statistics: {e}")
        return {'games_played': 0, 'games_won': 0}

def player_tournament_statistics(player_id):
    game_service_url = 'http://game:8001'
    endpoint = f'{game_service_url}/api/player/{player_id}/tournament_statistics/'

    try:
        response = requests.get(endpoint)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching statistics: {e}")
        return {'tournaments_played': 0, 'tournament_score': 0}

@api_view(['GET'])
def profile_page(request):
    if request.user.is_authenticated:
        user_id = request.user.id
        stats_games = player_game_statistics(user_id)
        stats_tournaments = player_tournament_statistics(user_id)
        print(stats_games)
        context = {
            'user': request.user,
            'stats_games': stats_games,
            'stats_tournaments': stats_tournaments,
        }
        profile_html = render_to_string('profile.html', context)
        return JsonResponse({'profile_html': profile_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'user not authenticated'}, status=401)

@api_view(['GET'])
def profile_settings_page(request):
    if request.user.is_authenticated:
        context = {
            'user': request.user,
        }
        profile_settings_html = render_to_string('settings_profile.html', context)
        return JsonResponse({'profile_settings_html': profile_settings_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'user not authenticated'}, status=401)

@api_view(['POST'])
def update_profile_settings(request):
    if request.user.is_authenticated:
        data = request.data
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')

        user = request.user
        user.first_name = first_name
        user.last_name = last_name
        user.save()

        return JsonResponse({'success': True, 'message': 'Settings updated successfully!'})
    else:
        return JsonResponse({'success': False, 'error': 'User not authenticated.'}, status=401)
from django.urls import path
from . import views

urlpatterns = [
    path('api/player/<int:player_id>/tournament_statistics/', views.get_player_tournament_statistics, name='player_tournament_statistics'),
]
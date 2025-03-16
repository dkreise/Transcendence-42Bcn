from django.urls import path
from . import views

urlpatterns = [
    path('api/player/<int:player_id>/tournament_statistics/', views.get_player_tournament_statistics, name='player_tournament_statistics'),
    path('api/tournament-home-page/', views.tournament_home_page, name="tournament_home_page"),
]
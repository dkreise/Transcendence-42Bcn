from django.urls import path
from . import views

urlpatterns = [
    path('api/player/<int:player_id>/tournament_statistics/', views.get_player_tournament_statistics, name='player_tournament_statistics'),
    path('api/tournament-home-page/', views.tournament_home_page, name="tournament_home_page"),
    path('api/tournament-creator/', views.tournament_creator, name="tournament_creator"),
    path('api/get-players-count/<int:tournament_id>/', views.get_players_count, name="get_players_count"),
    path('api/get-players-count/${tournamentId}', views.get_players_count, name="get_players_count"),
    path('api/join-tournament-page/', views.join_tournament_page, name="join_tournament_page"),
    path('api/join-tournament/', views.join_tournament, name="join_tournament"),
    path('api/tournament-bracket-page/', views.tournament_bracket_page, name="tournament_bracket_page"),
]
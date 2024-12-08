from django.urls import path
from . import views

urlpatterns = [
    path('players/', views.player_list, name='player_list'),
    path('game/', views.game_button),
    path('get_names/', views.get_current_players, name='get_current_players'),
    path('send_score/', views.send_score, name='send_score'),
    path('scores/', views.score_list, name='score_list'),
    path('winner/', views.winner_page, name='winner'),
    path('api/player/<int:player_id>/game_statistics/', views.get_player_game_statistics, name='player_game_statistics'),
]
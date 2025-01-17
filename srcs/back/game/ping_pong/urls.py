from django.urls import path
from . import views, localGame
from django.urls import path, include

urlpatterns = [
    path('players/', views.player_list, name='player_list'),
    path('get_names/', views.get_current_players, name='get_current_players'),
    path('send_score/', views.send_score, name='send_score'),
    path('scores/', views.score_list, name='score_list'),
    path('winner/', views.winner_page, name='winner'),

    path('api/game/local-game/get-name/', localGame.get_second_name, name='get_name'),
    # path('api/save-score')

    path('api/player/<int:player_id>/game_statistics/', views.get_player_game_statistics, name='player_game_statistics'),
    path('api/player/<int:player_id>/last_ten_games/', views.get_player_last_ten_games, name='last_ten_games'),
    path('api/player/<int:player_id>/all_games/', views.get_player_all_games, name='all_games'),

]

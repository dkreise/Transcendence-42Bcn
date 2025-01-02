from django.urls import path
from . import views
from django.urls import path, include

urlpatterns = [
    path('players/', views.player_list, name='player_list'),
    path('get_names/', views.get_current_players, name='get_current_players'),
    path('send_score/', views.send_score, name='send_score'),
    path('scores/', views.score_list, name='score_list'),
    path("ws/", include("game.routing")),
]

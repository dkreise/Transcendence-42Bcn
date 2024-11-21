from django.db import models
from django.conf import settings

# Create your models here.

class Game(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='games_as_player1', null=True) #winner
    score_player1 = models.IntegerField(default=0)
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='games_as_player2', null=True)
    score_player2 = models.IntegerField(default=0)
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='games_as_winner', null=True) #winner
    tournament_id = models.IntegerField(default=-1)
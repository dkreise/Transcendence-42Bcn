from django.db import models
from django.conf import settings # its for AUTH_USER_MODEL that is default user table

# Create your models here.

class Tournament(models.Model):
    id_tournament = models.IntegerField(default=0) # not unique 
    player = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tournaments_as_participant')
    score = models.IntegerField(default=0)

#     def __str__(self):
#         return self.name

#     def __str__(self):
#         return f"{self.player1} vs {self.player2} - Winner: {self.winner}"


from django.db import models

# Create your models here.

class Player(models.Model):
    name = models.CharField(max_length=30)

    def __str__(self):
        return self.name

class Match(models.Model):
    pl1 = models.ForeignKey(Player, related_name='matches_as_player1', on_delete=CASCADE)
    pl2 = models.ForeignKey(Player, related_name='matches_as_player2', on_delete=CASCADE)
    winner = models.ForeignKey(Player, related_name='wins', on_delete=models.CASCADE, null=True, blank=True)
    time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player1} vs {self.player2} - Winner: {self.winner}"
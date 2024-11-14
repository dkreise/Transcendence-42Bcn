from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Game

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model: User
        fields = ['id', 'username']

class GameSerializer(serializers.ModelSerializer):
    player1 = PlayerSerializer(read_only=True)  # Use PlayerSerializer for player1
    player2 = PlayerSerializer(read_only=True)  # Use PlayerSerializer for player2

    class Meta:
        model = Game
        fields = [
            'id',
            'date',
            'player1',
            'score_player1',
            'player2',
            'score_player2',
            'winner',
            'tournament_id',
        ]
        read_only_fields = ['date', 'player1', 'player2']
    
    def __str__(self):
        return f"{self.player1} vs {self.player2} - Winner: {self.winner}"s
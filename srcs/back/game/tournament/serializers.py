from rest_framework import serializers
from .models import Player, Match

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model: Player
        fields = ['id', 'name']

class MatchSerializer(serializers.ModelSerializer):
    pl1 = PlayerSerializer()
    pl2 = PlayerSerializer()
    winner = PlayerSerializer()

    class Meta:
        model = Match
        fields = ['id', 'pl1', 'pl2', 'winner', 'time']
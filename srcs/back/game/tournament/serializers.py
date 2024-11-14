from rest_framework import serializers
from .models import Tournament
from ping_pong.serializers import PlayerSerializer

class TournamentSerializer(serializers.ModelSerializer):
    player = PlayerSerializer(read_only=True)

    class Meta:
        model = Tournament
        fields = ['id', 'id_tournament', 'player', 'score']
        read_only_fields = ['player']

    
from django.contrib.auth.models import User
from ping_pong.models import Game
from tournament.models import Tournament

# Retrieve the existing users
dins = User.objects.get(username='dins')
bobby = User.objects.get(username='bobby')
nuria = User.objects.get(username='nuria')
julia = User.objects.get(username='julia')
diana = User.objects.get(username='diana')

# Create games
game1 = Game.objects.create(player1=dins, score_player1=15, player2=bobby, score_player2=10, winner=dins)
game2 = Game.objects.create(player1=nuria, score_player1=8, player2=julia, score_player2=12, winner=julia)
game3 = Game.objects.create(player1=bobby, score_player1=10, player2=diana, score_player2=5, winner=bobby)
game4 = Game.objects.create(player1=diana, score_player1=10, player2=julia, score_player2=5, winner=diana)
game5 = Game.objects.create(player1=diana, score_player1=12, player2=bobby, score_player2=7, winner=diana)
game6 = Game.objects.create(player1=nuria, score_player1=10, player2=diana, score_player2=9, winner=nuria)
game7 = Game.objects.create(player1=diana, score_player1=3, player2=dins, score_player2=8, winner=dins)

# Create tournaments
tournament1 = Tournament.objects.create(id_tournament=1, player=dins, score=75.0)
tournament2 = Tournament.objects.create(id_tournament=1, player=bobby, score=60.0)
tournament3 = Tournament.objects.create(id_tournament=2, player=nuria, score=85.0)
tournament4 = Tournament.objects.create(id_tournament=2, player=julia, score=90.0)
tournament5 = Tournament.objects.create(id_tournament=2, player=diana, score=50.0)
tournament6 = Tournament.objects.create(id_tournament=3, player=diana, score=90.0)

# Save the objects
game1.save()
game2.save()
game3.save()
game4.save()
game5.save()
game6.save()
game7.save()
tournament1.save()
tournament2.save()
tournament3.save()
tournament4.save()
tournament5.save()
tournament6.save()

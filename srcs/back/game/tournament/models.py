from django.db import models
from django.conf import settings # its for AUTH_USER_MODEL that is default user table

# Create your models here.

class Tournament(models.Model):
    player = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tournaments_as_participant')
    score = models.FloatField() # in percentage !!
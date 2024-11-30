from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import response
from rest_framework.decorators import api_view
from .models import Player, Match
from .serializers import PlaySerializer, MatchSerializer
import random

# Create your views here.

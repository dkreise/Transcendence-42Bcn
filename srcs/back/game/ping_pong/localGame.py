from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from .models import Game
from .serializers import PlayerSerializer, GameSerializer
from django.contrib.auth.models import User, AnonymousUser
import random
from django.db.models import Q
from game.utils.translations import add_language_context 
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.template.loader import render_to_string
import logging
import json
import requests
from django.conf import settings
import re
from django.shortcuts import get_object_or_404
from django.utils.translation import activate
from django.contrib.auth.decorators import login_required

logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_second_name(request):
    print("In get second name headers: ", request.headers)
    print("In get second name api: ", request.user)
    if request.user:
        context = {
            'user': request.user,
        }
        add_language_context(request, context)
        get_second_name_html = render_to_string('get_name.html', context)
        return JsonResponse({'get_name.html': get_second_name_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'user not authenticated'}, status=402)
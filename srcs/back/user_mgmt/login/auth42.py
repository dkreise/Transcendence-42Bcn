from django.http import JsonResponse, HttpResponse
#from django.views.decorators.csrf import csrf_exempt
# from django.forms.models import model_to_dict
# from django.core.files.base import ContentFile
# from PIL import Image
from pathlib import Path
from django.contrib.auth.models import User
import logging
import json
import os
import random
import string
import requests

from django.contrib.auth import authenticate, login as django_login
from django.contrib.auth import logout as django_logout
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from django.templatetags.static import static
import re
from .views import generate_temp_token

from datetime import datetime

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def login_intra(request):
    state = gen_state()
    logger.info("Redirect URI: %s", settings.REDIRECT_URI)
    go_to_api = (
        "https://api.intra.42.fr/oauth/authorize"
        f"?client_id={settings.UID}"
        # f"&redirect_uri={settings.REDIRECT_URI}"
        f"&redirect_uri=http://localhost:8443/callback"
        f"&response_type=code"
        f"&scope=public"
        f"&state={state}"
    )
    print("Environment variables:")
    print("UID:", os.environ.get('UID'))
    print("SECRET:", os.environ.get('SECRET'))
    print("REDIRECT_URI:", os.environ.get('REDIRECT_URI'))
    logger.info(f"Redirect URL: {go_to_api}")
    return redirect(go_to_api)


def gen_state():
	return ''.join(random.choices(string.ascii_letters + string.digits, k=16))

@method_decorator(csrf_exempt, name='dispatch')
class Callback42API(APIView):
    """ """

    permission_classes = [AllowAny]

    def has_permission(self, request, view):
        return True  # Explicitly allow all requests

    def post(self, request):
        # print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        code = request.GET.get('code')
        state = request.GET.get('state')
        print(f"Code: {code}, State: {state}")
        if not state or not code:
            raise AuthenticationFailed("Invalid authentication parameters")
        try:
            response = post42("/oauth/token", defaultParams(code, state))
            # print("1111!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", response.content)
            if response.status_code != 200:
                raise AuthenticationFailed("Bad response code while authentication")
            # print("222!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")  
            data = response.json()
            intra_token = data.get("access_token")
            user = saveUser(str(intra_token))
            # print("333!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")  
            if user == AnonymousUser:
                raise AuthenticationFailed("Authentication failed")
            print("42 username !!!!!!!!!!!!!!!!!!:", user.username)
            # print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")  
            # django_login(request, user)

            profile = user.profile
            if profile.two_fa:
                temp_token = generate_temp_token(user)
                return Response({
                    'success': True,
                    'two_fa_required': True,
                    'temp_token': temp_token,
                    'intra_token': str(intra_token),
                    'username': user.first_name,
                    'message': '2FA required. Provide the verification code.'
                })

            if request.user.is_authenticated:
                print("User authenticated successfully:", request.user.username)
            else:
                print("User authentication failed")
            # print("777!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", user.profile.photo)
            refresh_token = RefreshToken.for_user(user)
            loginResponse = {
                'success': True,
                'two_fa_required': False,
                'refresh_token': str(refresh_token),
                'access_token': str(refresh_token.access_token), 
                # 'intra_token': str(intra_token),
                'username': user.username,
                'name': user.first_name
            }
            return JsonResponse(loginResponse)
        except Exception as e:
            return JsonResponse({'Error': str(e)}, status=400)

def saveUser(token):
    try:
        user_res = get42('/v2/me', None, token)
        if user_res.status_code != 200:
            raise AuthenticationFailed("Bad response code while authentication")
        user_data = user_res.json()
        # print("55555!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", user_data.get('login'))  
        if not user_data.get('login'):
            raise AuthenticationFailed("Couldn't recognize the user")
        # print("7777!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")  
        name42 = '@42' + user_data.get('login')
        # print("42 username !!!!!!!!!!!!!!!!!!:", name42)  
        try:
            exist = User.objects.filter(username=name42).exists() # try catch
            # print("888!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", exist)  
            if exist:
                return User.objects.get(username=name42)
        except Exception as e:
            print("Database empty, creating a user...")
        user = User(username=name42, email=user_data.get('email'), first_name=user_data.get('first_name'), last_name=user_data.get('last_name')) # add first_name, last_name, photo
        user.save()
        user_img = None # here the default
        if user_data['image']['link']:
            user_img = user_data['image']['link']
        # user.profile.photo = user_img
        user.profile.external_photo_url = user_img
        # print("777!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", user.profile.photo)  
        user.profile.save()
        return user
    except Exception as e:
        print("RETURNING Anonimous")
        return AnonymousUser()

def defaultParams(code, state):
    params = {
        'grant_type': 'authorization_code',
        'client_id': os.environ['UID'],
        'client_secret': os.environ['SECRET'],
        'code': code,
        # 'redirect_uri': os.environ['REDIRECT_URI'],
        'redirect_uri': 'http://localhost:8443/callback',
        'state': state
    }
    return params

def post42(url, vars):
    url = "https://api.intra.42.fr" + url
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    response = requests.request("POST", url, headers=headers, data=vars)
    return response

def get42(url, vars, auth):
    url = "https://api.intra.42.fr" + url
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + auth
    }
    response = requests.request("GET", url, headers=headers)
    return response

# Example token blocklist (you may use a database or Redis for scalability)
# BLOCKLIST = set()

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def logout_view(request):
#     # Get the refresh token from the request
      
#     refresh_token = request.data.get('refresh_token')
#     print("LOGOUT: ", request.data.get('refresh_token'))
#     # 'intra_token'
#     user = User.objects.get(username=request.data.get('username'))
#     if refresh_token:
#         try:
#             # Blacklist the token
#             token = RefreshToken(refresh_token)
#             # BLOCKLIST.add(str(token))  # Replace with your blocklist logic (e.g., saving to DB/Redis)
#             token.blacklist()  # Use if you enabled Django REST Framework SimpleJWT's blacklist app
#         except Exception as e:
#             return JsonResponse({'detail': 'Invalid token'}, status=400)
    
#     # Log out the user from Django (clears session data)
#     django_logout(request, user)
    
#     # Clear the refresh token cookie
#     response = JsonResponse({'detail': 'Successfully logged out'})
#     response.delete_cookie('refresh_token')
    
#     return response
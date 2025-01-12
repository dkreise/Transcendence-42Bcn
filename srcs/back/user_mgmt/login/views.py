from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.template.loader import render_to_string
from django.contrib.auth.forms import AuthenticationForm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from rest_framework import status
import json
import re
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
import requests

# def home(request):
#     if not request.user.is_authenticated:
#         return HttpResponseRedirect(reverse("login"))
#     return render(request, "user.html")

def generate_jwt_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anyone to access this API
def login_view(request):
    print("login api called")
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is not None:
        #login(request, user)
        tokens = generate_jwt_tokens(user)
        return Response({'success': True, 'tokens': tokens, 'message': 'Login successful'})
    else:
        return Response({'success': False, 'message': 'Invalid credentials'}, status=401)


@api_view(['GET'])
@permission_classes([AllowAny])
def login_form_api(request):
    if request.method == "GET":
        print("Login form API called")
        form_html = render_to_string('login.html')
        return JsonResponse({'form_html': form_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

# @api_view(['GET'])
# def user_info_api(request):
#     if request.user.is_authenticated:
#         context = {
#             'user': request.user,  # Pass the user object to the template
#         }
#         # Render the HTML with the user's data
#         user_html = render_to_string('user.html', context)
#         return JsonResponse({'user_html': user_html}, content_type="application/json")
#     else:
#         return JsonResponse({'error': 'user not authenticated'}, status=401)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        data = json.loads(request.body)
        username = data.get("username")
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        repassword = data.get("repassword")

        if password != repassword:
            return JsonResponse({"error": "Password mismatch."}, status=status.HTTP_400_BAD_REQUEST)

        if not username or not email or not password or not name:
            return JsonResponse({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not re.match(r'^[a-zA-Z0-9.]+$', username):
            return JsonResponse({"error": "Username should consist only of letters, digits and dots(.)."}, status=status.HTTP_400_BAD_REQUEST)

        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return JsonResponse({"error": "Invalid email format."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return JsonResponse({"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

        # maybe to check also for invalid characters in username?

        user = User.objects.create(
            username=username,
            first_name=name,
            email=email,
            password=make_password(password) # to hash it (? if its not done automatically ?)
        )

        # return JsonResponse({"message": "User registered successfully!", "user_id": user.id}, status=status.HTTP_201_CREATED)
        tokens = generate_jwt_tokens(user)
        return Response({'success': True, 'tokens': tokens, 'message': 'Login successful'})
    # else:

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format."}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		
@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    try:
        print("trying logout")
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({"error": "No refresh token provided"}, status=400)

        token = RefreshToken(refresh_token)
        token.blacklist()
        print("refresh blacklisted")
        # access_token = request.data.get('access_token')
        # if not access_token:
        #     print("no access token")
        #     return Response({"error": "No access token provided"}, status=400)
        # print("we have access token")
        # print(f"access token: *{access_token}*")
        # token = AccessToken(access_token)
        # print("we converted access token")
        # token.blacklist()
        # print("access blacklisted")

        return Response({"message": "Logged out successfully"}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
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
from django.contrib.auth.models import User, AnonymousUser
from django.contrib.auth.hashers import make_password
from rest_framework import status
import json
import re
import requests
from user_profile.models import Profile
from .twoFA import TwoFA  
import base64
from datetime import datetime, timedelta
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.conf import settings
from user_mgmt.utils.translations import add_language_context
from rest_framework.exceptions import AuthenticationFailed
def generate_jwt_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def generate_temp_token(user, validity_minutes=5):
    temp_token = AccessToken()
    temp_token["user_id"] = user.id
    # temp_token["username"] = user.username
    # temp_token["2fa_verified"] = False  # custom claims
    temp_token.set_exp(lifetime=timedelta(minutes=validity_minutes))
    return str(temp_token)

def decode_temp_token(temp_token):
    try:
        token = AccessToken(temp_token)
        user_id = token["user_id"]
        # username = token["username"]
        # is_verified = token.get("2fa_verified", False)
        return user_id
    except AuthenticationFailed as e:
        print("Invalid or expired token:", str(e))
        return None

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anyone to access this API
def login_view(request):
    print("login api called")
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is not None:
        if not hasattr(user, 'profile'):
            Profile.objects.create(user=user)
        profile = user.profile
        if profile.two_fa:
            temp_token = generate_temp_token(user)
            return Response({
                'success': True,
                'two_fa_required': True,
                'temp_token': temp_token,
                'message': '2FA required. Provide the verification code.'
            })
        else:
            tokens = generate_jwt_tokens(user)
            return Response({
                'success': True,
                'two_fa_required': False,
                'tokens': tokens,
                'message': 'Login successful',
                'username': username,
            })
    else:
        return Response({'success': False, 'message': get_translation(request, 'invalid_credentials')})

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_login_2fa(request):
    data = json.loads(request.body)
    temp_token = data.get('temp_token')    
    if not temp_token:
        return Response({'success': False, 'message': get_translation(request, "invalid_temp_token")})
    code = data.get('code')
    user_id = decode_temp_token(temp_token)

    if not user_id:
        return Response({'success': False, 'message': get_translation(request, "invalid_temp_token")})
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        if not profile.two_fa:
            return Response({'success': False, 'message': get_translation(request, "2fa_not_enable")})
        if TwoFA.verify_code(profile.totp_secret, code):
            tokens = generate_jwt_tokens(user)
            return Response({'success': True, 'tokens': tokens, 'message': get_translation(request, "2fa_verification_success"), 'username': user.username})
        else:
            return Response({'success': False, 'message': get_translation(request, "invalid_verification_code")})
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'User does not exist.'})

# @api_view(['GET'])
# @permission_classes([AllowAny])
# def login_form_api(request):
#     if request.method == "GET":
#         print("Login form API called")
#         form_html = render_to_string('login.html')
#         return JsonResponse({'form_html': form_html}, content_type="application/json")
#     else:
#         return JsonResponse({'error': 'Invalid request method'}, status=405)

@api_view(['GET'])
@permission_classes([AllowAny])
def login_form(request):
    print("Login form API called")
    context = {}
    add_language_context(request.COOKIES, context)
    form_html = render_to_string('login_form.html', context)
    return JsonResponse({'form_html': form_html}, content_type="application/json")

@api_view(['GET'])
@permission_classes([AllowAny])
def signup_form(request):
    print("Signup form API called")
    context = {}
    add_language_context(request.COOKIES, context)
    form_html = render_to_string('signup_form.html', context)
    return JsonResponse({'form_html': form_html}, content_type="application/json")

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_2fa_login_form(request):
    context = {}
    add_language_context(request.COOKIES, context)
    form_html = render_to_string('2fa_verify.html', context)
    return JsonResponse({'form_html': form_html}, content_type="application/json")

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

        if not username or not email or not password or not name:
            return JsonResponse({'success': False, "error": get_translation(request, "all_fields_required")})
        
        if password != repassword:
            return JsonResponse({'success': False, "error": get_translation(request, "password_mismatch")})
        
        if not re.match(r'^[a-zA-Z0-9.]+$', username):
            return JsonResponse({'success': False, "error": get_translation(request, "invalid_username")})
        
        if len(username) < 2 or len(username) > 10 or len(name) < 2 or len(name) > 10:
            return JsonResponse({'success': False, "error": get_translation(request, "username_length")})

        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return JsonResponse({'success': False, "error": get_translation(request, "invalid_email")})

        if User.objects.filter(username=username).exists():
            return JsonResponse({'success': False, "error": get_translation(request, "username_exists")})

        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, "error": get_translation(request, "email_registered")})

        # UNCOMMENT FOR STRONG PASSWORD CHECK:
        temp_user = User(username=username, email=email, first_name=name)

        try:
            validate_password(password, user=temp_user)
        except ValidationError as e:
            return JsonResponse({'success': False, "error": e.messages})
            # print(e.messages)
        user = User.objects.create(
            username=username,
            first_name=name,
            email=email,
            password=make_password(password) 
        )

        # return JsonResponse({"message": "User registered successfully!", "user_id": user.id}, status=status.HTTP_201_CREATED)
        tokens = generate_jwt_tokens(user)
        return Response({'success': True, 'tokens': tokens, 'message': 'Login successful', 'username': username})
    # else:

    except json.JSONDecodeError:
        return JsonResponse({'success': False, "error": get_translation(request, "invalid_json")})

    except Exception as e:
        return JsonResponse({"error": str(e)})
		
@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    try:
        print("trying logout")
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({"error": "No refresh token provided"})

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
        return Response({"error": str(e)})

@api_view(['POST'])
def enable_2fa(request):
    if request.user.is_authenticated:
        user = request.user
        profile = user.profile
        secret = TwoFA.generate_secret()
        profile.totp_secret = secret
        profile.save()

        provisioning_uri = TwoFA.get_provisioning_uri(secret, user.username)
        qr_image = TwoFA.generate_qrcode(provisioning_uri)
        qr_base64 = base64.b64encode(qr_image.getvalue()).decode()

        # print("QR Image:", qr_image)
        # print("QR Base64:", qr_base64)

        context = {"qr_code": qr_base64}
        add_language_context(request.COOKIES, context)
        setup_html = render_to_string("2fa_setup.html", context)

        # context = add_language_context(request.COOKIES)
        # setup_html = render_to_string("2fa_setup.html", {"qr_code": qr_base64}, context)

        return JsonResponse({
            "success": True,
            "setup_html": setup_html,
            "qr_code": qr_base64,
        })
    else:
        return JsonResponse({'error': 'user not authenticated'})
    
@api_view(['POST'])
def verify_2fa(request):
    if request.user.is_authenticated:
        user = request.user
        profile = user.profile
        secret = profile.totp_secret
        data = json.loads(request.body)
        code = data.get("code")
        print("CODE::::", code)

        if not secret:
            return JsonResponse({"success": False, "error": get_translation(request, "2fa_not_enable")})
        try:
            if TwoFA.verify_code(secret, code):
                profile.two_fa = True
                profile.save()
                return JsonResponse({"success": True, "message": get_translation(request, "2fa_verification_success")})
            else:
                return JsonResponse({"success": False, "error": get_translation(request, "invalid_code")})
        except ValueError as e:
            return JsonResponse({"success": False, "error": str(e)})
    else:
        return JsonResponse({'error': 'user not authenticated'})

@api_view(['POST'])
def disable_2fa(request):
    if request.user.is_authenticated:
        user = request.user
        profile = user.profile

        if profile.two_fa:
            profile.totp_secret = None
            profile.two_fa = False
            profile.save()
        return JsonResponse({"success": True, "message": get_translation(request, "2fa_disable")})
    else:
        return JsonResponse({'error': 'user not authenticated'})

@api_view(['GET'])
def check_status_2fa(request):
    if request.user.is_authenticated:
        user = request.user
        profile = user.profile
        is_enabled = profile.two_fa
        return JsonResponse({"success": True, "2fa_enabled": is_enabled})
    else:
        return JsonResponse({'error': 'user not authenticated'})

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_token(request):
    print("SUCCESFULLY ENTERED, VERIFYING TOKEN...")
    if request.user == AnonymousUser() or not request.user:
        return JsonResponse({'error': 'no token'}, status=498)
    username = request.user.username
    response = {"user": username}
    return JsonResponse(response)

@api_view(['GET'])
@permission_classes([AllowAny])
def page_not_found(request):
    context = {}
    add_language_context(request.COOKIES, context)
    page_not_found_html = render_to_string('page_not_found.html', context)
    return JsonResponse({'page_not_found_html': page_not_found_html}, content_type="application/json")

def get_translation(request, key):
    context = {}
    add_language_context(request.COOKIES, context)
    return context.get(key, key)

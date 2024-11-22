from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import serializers
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def home(request):
	if not request.user.is_authenticated:
		return HttpResponseRedirect(reverse("login"))
	return render(request, "user.html")
		

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            # Aquí se podría agregar lógica real de autenticación
            if username == "test" and password == "test":
                return JsonResponse({"message": "Login successful", "username": username, "pass": password}, status=200)
            return JsonResponse({"error": "Invalid credentials"}, status=401)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    return JsonResponse({"error": "Method not allowed"}, status=405)

def add_user(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        
        # Create the user
        user = User.objects.create_user(username=username, password=password)
        return render(request, "add_user.html", {"message": "User created successfully!"})
    
    return render(request, "add_user.html")


def logout_view(request):
	logout(request)
	return render(request, "login.html", {
		"message": "Logged out."
	})


def test_view(request):
    return render(request, 'test.html')

def new_page(request):
    return render(request, 'new_page.html')


@api_view(['GET'])
def get_users(request):
    users = User.objects.all()  # Fetch all users from the database
    serializer = UserSerializer(users, many=True)  # Serialize the users
    return Response(serializer.data)  
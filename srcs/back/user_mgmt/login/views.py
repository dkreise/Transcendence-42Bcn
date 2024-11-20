from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import serializers

def home(request):
	if not request.user.is_authenticated:
		return HttpResponseRedirect(reverse("login"))
	return render(request, "user.html")
		
def login_view(request):
	if request.method == "POST":
		username = request.POST["username"]
		password = request.POST["password"]
		user = authenticate(request, username=username, password=password)
		if user is not None: # means authentication was successful
			login(request, user)
			return HttpResponseRedirect(reverse("home"))
		else:
			return render(request, "login.html", {
				"message": "Invalid credentials."
			})
	return render(request, "login.html")

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
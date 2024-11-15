from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout

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
	
def logout_view(request):
	logout(request)
	return render(request, "login.html", {
		"message": "Logged out."
	})
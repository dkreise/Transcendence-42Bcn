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


# def home(request):
#     if not request.user.is_authenticated:
#         return HttpResponseRedirect(reverse("login"))
#     return render(request, "user.html")

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anyone to access this API
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({'success': True, 'message': 'Login successful'})
    else:
        return Response({'success': False, 'message': 'Invalid credentials'}, status=401)


@permission_classes([AllowAny])
def login_form_api(request):
    if request.method == "GET":
        print("Login form API called")
        form_html = render_to_string('login.html')
        return JsonResponse({'form_html': form_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)

#@login_required
def user_info_api(request):
    if request.user.is_authenticated:
        context = {
            'user': request.user,  # Pass the user object to the template
        }
        # Render the HTML with the user's data
        user_html = render_to_string('user.html', context)
        return JsonResponse({'user_html': user_html}, content_type="application/json")
    else:
        return JsonResponse({'error': 'user not authenticated'}, status=401)

		
# def login_view(request):
# 	if request.method == "POST":
# 		username = request.POST["username"]
# 		password = request.POST["password"]
# 		user = authenticate(request, username=username, password=password)
# 		if user is not None: # means authentication was successful
# 			login(request, user)
# 			return HttpResponseRedirect(reverse("home"))
# 		else:
# 			return render(request, "login.html", {
# 				"message": "Invalid credentials."
# 			})
# 	return render(request, "login.html")
	
# def logout_view(request):
# 	logout(request)
# 	return render(request, "login.html", {
# 		"message": "Logged out."
# 	})
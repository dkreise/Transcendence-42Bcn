from django.shortcuts import render
from rest_framework_simplejwt.tokens import AccessToken
from django.template.loader import render_to_string
from rest_framework.decorators import api_view
from django.http import JsonResponse


def root_view(request):
 
    #print('------->entro root_view<-------')
    jwt_token = request.COOKIES.get('csrftoken')
    if jwt_token:
        print('there is a token')
        try:
            AccessToken(jwt_token) # throw exception if token is not valid
            return render(request, 'profile.html')
        except Exception as e:
            print(f"Token error: {e}") #invalid token or expired

    return render(request, 'login.html')



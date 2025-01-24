from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
# from rest_framework_simplejwt.authentication import JWTAuthentication
import requests
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)

class CustomAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        # print("Request headers: ", request.headers)
        if not auth_header:
            return None
        headers = {"Authorization": auth_header}
        print("@@@@@@@@@@@@@@@@@@@@@@ AUTH MIDDLEWARE @@@@@@@@")
        # print("header: ", headers)
        # login_url = 'http://user_mgmt:8000'
        # endpoint = f'{login_url}/api/player/{player_id}/game_statistics/'
        req = requests.get('http://user-mgmt:8000/api/user-mgmt/verify-token/', headers=headers)
        # req = requests.get('http://user-mgmt:8000/api/user-mgmt/verify-token/')
        if req.status_code == 200:
            username = req.json()['user']
            if username:
                print("Passed with success: ", username)
                try:
                    user = User.objects.get(username=username)
                    return (user, None)
                except User.DoesNotExist:
                    raise AuthenticationFailed('Invalid or expired token')
        raise AuthenticationFailed('Invalid or expired token')
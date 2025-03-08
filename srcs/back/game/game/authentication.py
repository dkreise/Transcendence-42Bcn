from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
# from rest_framework_simplejwt.authentication import JWTAuthentication
import requests
from django.contrib.auth.models import User
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

USER_MGMT_PORT = settings.USER_MGMT_PORT
PROTOCOL_WEB = settings.PROTOCOL_WEB

class CustomAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        # print("Request headers: ", request.headers)
        if not auth_header:
            return None
        headers = {"Authorization": auth_header}
        print("@@@@@@@@@@@@@@@@@@@@@@ AUTH MIDDLEWARE @@@@@@@@")
        req = requests.get(PROTOCOL_WEB + '://user-mgmt:' + USER_MGMT_PORT + '/api/user-mgmt/verify-token/', headers=headers)
        if req.status_code == 200:
            username = req.json()['user']
            if username:
                print("Passed with success: ", username)
                try:
                    user = User.objects.get(username=username)
                    return (user, None)
                except User.DoesNotExist:
                    raise AuthenticationFailed('Invalid or expired token: User does not exist')
        raise AuthenticationFailed('Invalid or expired token')
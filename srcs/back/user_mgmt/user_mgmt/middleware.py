from urllib.parse import parse_qs
import logging
from channels.auth import AuthMiddlewareStack
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed
from asgiref.sync import sync_to_async
# from django.utils.deprecation import MiddlewareMixin

# class UpdateLastActivityMiddleware:
#     """"Upgrade last_activity en cada solicitud del usuario"""

#     def __init__(self, get_response):
#         self.get_response = get_response

logger = logging.getLogger(__name__)

# class NoCacheMiddleware(MiddlewareMixin):
#     """
#     Middleware to add no-cache headers to all responses.
#     """
#     def process_response(self, request, response):
#         # Set caching headers
#         response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
#         response['Pragma'] = 'no-cache'
#         response['Expires'] = '0'
#         print("@@@@@@@@@@@@@@@@@@@@@@@  HA PASADO POR MIDDLEWARE @@@@@@@@@@@@@@@@@")
#         return response

class JwtAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive=None, send=None):
        
        print("@@@@@@@@@@@@@@@@@@@@@@@  JWT  MIDDLEWARE @@@@@@@@@@@@@@@@@")
        query_string = scope['query_string'].decode('utf-8')
        query_params = parse_qs(query_string)
        
        token = query_params.get('token', [None])[0]
        
        if not token:
            raise AuthenticationFailed('Invalid or missing token')

        jwt_authenticator = JWTAuthentication()

        # Simular el request, ya que WebSockets no usan HTTP requests tradicionales
        # Vamos a crear un objeto "fake" para pasar a `authenticate`
        fake_request = type('Request', (object,), {'META': {'HTTP_AUTHORIZATION': f'Bearer {token}'}})()

        try:
            user, validated_token = await sync_to_async(jwt_authenticator.authenticate)(fake_request)

            if user:
                scope['user'] = user
                logger.info(f"User {user} authenticated successfully")
            else:
                raise AuthenticationFailed('Invalid or expired token')
        
        except AuthenticationFailed as e:
            logger.error(f"Authentication failed: {e}")
            raise AuthenticationFailed('Invalid or expired token')

        return await self.inner(scope, receive, send)

def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(AuthMiddlewareStack(inner))

# from rest_framework.authentication import BaseAuthentication
# from rest_framework.exceptions import AuthenticationFailed
# from rest_framework_simplejwt.authentication import JWTAuthentication
# import requests
# import logging
# from django.contrib.auth.models import User

# logger = logging.getLogger(__name__)

# class Intra42Authentication(BaseAuthentication):
#     def authenticate(self, request):
#         auth_header = request.headers.get('Authorization')
#         if not auth_header:
#             return None
#         print("==========================================================")
#         print(auth_header)
#         print("==========================================================")
        
#         jwt_authenticator = JWTAuthentication()
#         try:
#             user, validated_token = jwt_authenticator.authenticate(request)
#             if user:
#                 logger.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
#                 return (user, None)
#         except AuthenticationFailed:
#             logger.info("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
#             raise AuthenticationFailed('Invalid or expired token')
#         raise AuthenticationFailed('Invalid or expired token')


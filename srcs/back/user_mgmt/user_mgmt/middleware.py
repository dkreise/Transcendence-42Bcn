from urllib.parse import parse_qs
import logging
from channels.auth import AuthMiddlewareStack
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
# from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import AnonymousUser

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

# Fetch user from database using sync-to-async
async def get_user_from_token(username):
    User = get_user_model()
    try:
        return await sync_to_async(User.objects.get)(username=username)
    except ObjectDoesNotExist:
        raise AuthenticationFailed('Invalid or expired token')

class JwtAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive=None, send=None):
        
        print("@@@@@@@@@@@@@@@@@@@@@@@  JWT  MIDDLEWARE @@@@@@@@@@@@@@@@@")
        User = get_user_model()
        query_string = scope['query_string'].decode('utf-8')
        query_params = parse_qs(query_string)
        
        token = query_params.get('token', [None])[0]
        
        if not token:
            scope['user'] = AnonymousUser()
            return await self.inner(scope, receive, send)
            # raise AuthenticationFailed('Invalid or missing token')

        jwt_authenticator = JWTAuthentication()

        fake_request = type('Request', (object,), {'META': {'HTTP_AUTHORIZATION': f'Bearer {token}'}})()

        try:
            user, validated_token = await sync_to_async(jwt_authenticator.authenticate)(fake_request)

            if user:
                scope['user'] = user
                logger.info(f"User {user} authenticated successfully")
            else:
                scope['user'] = AnonymousUser()
                # raise AuthenticationFailed('Invalid or expired token')
        
        except (InvalidToken, TokenError, AuthenticationFailed) as e:
            scope['user'] = AnonymousUser()

        return await self.inner(scope, receive, send)

def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(AuthMiddlewareStack(inner))


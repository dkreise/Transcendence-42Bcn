from urllib.parse import parse_qs
import logging
from asgiref.sync import sync_to_async
from channels.auth import AuthMiddlewareStack
# from django.contrib.auth.models import AnonymousUser
# from django.core.exceptions import ObjectDoesNotExist
# from django.contrib.auth import get_user_model
import aiohttp

# logger = logging.getLogger(__name__)

# async def get_user_from_token(username):
#     try:
#         return await sync_to_async(Users.objects.get)(username=username)
#     except ObjectDoesNotExist:
#         raise AuthenticationFailed('Invalid or expired token')

# class JwtAuthMiddleware:
#     def __init__(self, inner):
#         self.inner = inner

#     async def __call__(self, scope, receive, send):
#         try:
#             print("@@@@@@@@@@@@@@@@@@@@@@@  TOKEN: HA PASADO POR MIDDLEWARE @@@@@@@@@@@@@@@@@")
#             query_string = scope['query_string'].decode('utf-8')
#             query_params = parse_qs(query_string)
#             token = query_params.get('token', [None])[0]

#             if not token:
#                 raise AuthenticationFailed('No token provided')

#             headers = {"Authorization": f"Bearer {token}"}
#             logger.info(f"Headers sent: {headers}")

#             try:
#                 async with aiohttp.ClientSession() as session:
#                     async with session.get("http://login:8000/api/verify_token/", headers=headers) as resp:
#                         if resp.status == 200:
#                             json_resp = await resp.json()
#                             username = json_resp.get('user')
#                             if username:
#                                 scope['user'] = await get_user_from_token(username)
#                             else:
#                                 raise AuthenticationFailed('Invalid or expired token')
#                         else:
#                             logger.error(f"Token verification failed with status: {resp.status}")
#                             raise AuthenticationFailed('Invalid or expired token')
#             except aiohttp.ClientError as e:
#                 logger.error(f"HTTP error during token verification: {e}")
#                 raise AuthenticationFailed('Token verification failed')

#             return await self.inner(scope, receive, send)

#         except AuthenticationFailed as e:
#             logger.error(f"Authentication failed: {e}")
#             close_message = {
#                 'type': 'websocket.close',
#                 'code': 4001
#             }
#             await send(close_message)
#         except Exception as e:
#             logger.error(f"Unexpected error: {e}")
#             close_message = {
#                 'type': 'websocket.close',
#                 'code': 4000
#             }
#             await send(close_message)

# def JwtAuthMiddlewareStack(inner):
#     return JwtAuthMiddleware(AuthMiddlewareStack(inner))


# Fetch user from database using sync-to-async
async def get_user_from_token(username):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        return await sync_to_async(User.objects.get)(username=username)
    except ObjectDoesNotExist:
        raise AuthenticationFailed('Invalid or expired token')

# Middleware for both WebSocket and HTTP requests
class JwtAuthMiddleware:
    
    def __init__(self, get_response=None):
        """
        Initializes the middleware. 
        For HTTP requests, `get_response` is the next middleware in the chain.
        """
        self.get_response = get_response

    # Ensure Django apps are ready
        # if not apps.ready:
        #     raise ImproperlyConfigured("Django apps are not initialized yet")
        # logger.info("Middleware initialized successfully.")

    async def verify_token(self, token):
        """
        Verifies a JWT token with an external service.
        Sends an asynchronous HTTP request and returns the username if the token is valid.
        Returns None if the token is invalid or the service fails.
        """
        headers = {"Authorization": f"Bearer {token}"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("http://user-mgmt:8000/api/user-mgmt/verify-token/", headers=headers) as resp:
                    if resp.status == 200:
                        json_resp = await resp.json()
                        return json_resp.get('user')  # Returns username if valid
                    else:
                        print(f"Token verification failed with status: {resp.status}")
                        return None
        except aiohttp.ClientError as e:
            print(f"HTTP error during token verification: {e}")
            return None

    async def handle_websocket(self, scope, receive, send):
        """
        Handles WebSocket authentication.
        Extracts the token from the query string, verifies it, and attaches the user to the scope.
        Closes the WebSocket if authentication fails.
        """
        from urllib.parse import parse_qs
        from django.contrib.auth import get_user_model
        User = get_user_model()

        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        print("@@@@@@@@@@@@@@@@@@@@@@@  1!!!!!!!!!!!!!!!!!!!!!!!!!! @@@@@@@@@@@@@@@@@")
        if token:
            print("@@@@@@@@@@@@@@@@@@@@@@@  2!!!!!!!!!!!!!!!!!!!!!!!!!! @@@@@@@@@@@@@@@@@")
            username = await self.verify_token(token)
            if username:
                scope['user'] = await get_user_from_token(username)
                print("USER FOUND: ", scope['user'])
            else:
                print("Invalid or expired token for WebSocket connection.")
                await send({'type': 'websocket.close', 'code': 4001})
                return
        else:
            print("No token provided for WebSocket connection.")
            await send({'type': 'websocket.close', 'code': 4001})
            return

    
    async def __call__(self, scope, receive=None, send=None):
        """Entry point for WebSocket and HTTP requests."""
        print("@@@@@@@@@@@@@@@@@@@@@@@  TOKEN: HA PASADO POR MIDDLEWARE @@@@@@@@@@@@@@@@@")
        print("SCOPE: ", scope)
        # Import models or settings here, not globally
        # User = apps.get_model('auth', 'User')  # Example
        # query_string = scope.get('query_string', b'').decode('utf-8')
        # query_params = parse_qs(query_string)
        # token = query_params.get('token', [None])[0]
        # print("Query string:", query_string)
        
        if scope['type'] == 'websocket':
            # For WebSocket connections
            await self.handle_websocket(scope, receive, send)

# Middleware wrapper for Django Channels
def JwtAuthMiddlewareStack(inner):
    """
    Middleware wrapper for Django Channels to support WebSocket connections.
    Wraps the WebSocket routing with JwtAuthMiddleware.
    """
    return JwtAuthMiddleware(AuthMiddlewareStack(inner))



###############################################################
##############################################################
###############################################################
#############################################################################################################################
##############################################################
###############################################################
##############################################################
###############################################################
##############################################################

# from rest_framework.authentication import BaseAuthentication
# from rest_framework.exceptions import AuthenticationFailed
# # from rest_framework_simplejwt.authentication import JWTAuthentication
# import requests
# from django.contrib.auth.models import User
# import logging

# logger = logging.getLogger(__name__)

# class CustomAuthentication(BaseAuthentication):
#     def authenticate(self, request):
#         auth_header = request.headers.get('Authorization')
#         # print("Request headers: ", request.headers)
#         if not auth_header:
#             return None
#         headers = {"Authorization": auth_header}
#         print("@@@@@@@@@@@@@@@@@@@@@@ AUTH MIDDLEWARE @@@@@@@@")
#         # print("header: ", headers)
#         # login_url = 'http://user_mgmt:8000'
#         # endpoint = f'{login_url}/api/player/{player_id}/game_statistics/'
#         req = requests.get('http://user-mgmt:8000/api/user-mgmt/verify-token/', headers=headers)
#         # req = requests.get('http://user-mgmt:8000/api/user-mgmt/verify-token/')
#         if req.status_code == 200:
#             username = req.json()['user']
#             if username:
#                 print("Passed with success: ", username)
#                 try:
#                     user = User.objects.get(username=username)
#                     return (user, None)
#                 except User.DoesNotExist:
#                     raise AuthenticationFailed('Invalid or expired token')
#         raise AuthenticationFailed('Invalid or expired token')
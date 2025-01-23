# from urllib.parse import parse_qs
# import logging
# from asgiref.sync import sync_to_async
# from channels.auth import AuthMiddlewareStack
# # from django.contrib.auth.models import AnonymousUser
# from django.core.exceptions import ObjectDoesNotExist
# from django.contrib.auth import get_user_model
# import aiohttp

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

# from urllib.parse import parse_qs
# import logging
# from channels.auth import AuthMiddlewareStack
# from django.contrib.auth import get_user_model
# # from rest_framework_simplejwt.authentication import JWTAuthentication
# # from django.contrib.auth.models import User, AnonymousUser
# # from rest_framework.exceptions import AuthenticationFailed
# from django.core.exceptions import ObjectDoesNotExist
# from asgiref.sync import sync_to_async
# from django.utils.deprecation import MiddlewareMixin
# from django.http import JsonResponse
# import jwt
# import aiohttp
# import asyncio
# import os
# import requests
# from django.apps import apps

# logger = logging.getLogger(__name__)

# # class JwtAuthMiddleware(MiddlewareMixin):
# #     """
# #     Middleware to authenticate requests using a JWT token.
# #     The token is sent to an external service for validation.
# #     """

# #     def process_request(self, request):
# #         # Extract the token from the Authorization header
# #         print("@@@@@@@@@@@@@@@@@@@@@@@  TOKEN: HA PASADO POR MIDDLEWARE @@@@@@@@@@@@@@@@@")
# #         auth_header = request.headers.get('Authorization')
# #         if not auth_header or not auth_header.startswith('Bearer '):
# #             return JsonResponse({'error': 'No token provided'}, status=401)

# #         token = auth_header.split(' ')[1]

# #         # Validate the token with the external service
# #         try:
# #             response = requests.post(
# #                 'http://login:8000/api/verify_token/',
# #                 headers={'Authorization': f'Bearer {token}'}
# #             )

# #             if response.status_code == 200:
# #                 # Token is valid, extract user information
# #                 data = response.json()
# #                 username = data.get('user')  # Assuming the response contains 'user'

# #                 if username:
# #                     # Attach the username (or other user data) to the request
# #                     request.user = username
# #                 else:
# #                     return JsonResponse({'error': 'Invalid token response'}, status=401)

# #             else:
# #                 return JsonResponse({'error': 'Token verification failed'}, status=response.status_code)

# #         except requests.RequestException as e:
# #             # Handle connection errors
# #             return JsonResponse({'error': f'Error communicating with auth service: {str(e)}'}, status=500)

# Fetch user from database using sync-to-async
# async def get_user_from_token(username):
#     from django.contrib.auth import get_user_model
#     User = get_user_model()
#     try:
#         return await sync_to_async(User.objects.get)(username=username)
#     except ObjectDoesNotExist:
#         raise AuthenticationFailed('Invalid or expired token')

# # Middleware for both WebSocket and HTTP requests
# class JwtAuthMiddleware:
    
#     def __init__(self, get_response=None):
#         """
#         Initializes the middleware. 
#         For HTTP requests, `get_response` is the next middleware in the chain.
#         """
#         self.get_response = get_response

#     # Ensure Django apps are ready
#         # if not apps.ready:
#         #     raise ImproperlyConfigured("Django apps are not initialized yet")
#         logger.info("Middleware initialized successfully.")

#     async def verify_token(self, token):
#         """
#         Verifies a JWT token with an external service.
#         Sends an asynchronous HTTP request and returns the username if the token is valid.
#         Returns None if the token is invalid or the service fails.
#         """
#         headers = {"Authorization": f"Bearer {token}"}
#         try:
#             async with aiohttp.ClientSession() as session:
#                 async with session.get("http://login:8000/api/verify_token/", headers=headers) as resp:
#                     if resp.status == 200:
#                         json_resp = await resp.json()
#                         return json_resp.get('user')  # Returns username if valid
#                     else:
#                         logger.error(f"Token verification failed with status: {resp.status}")
#                         return None
#         except aiohttp.ClientError as e:
#             logger.error(f"HTTP error during token verification: {e}")
#             return None

#     async def handle_websocket(self, scope, receive, send):
#         """
#         Handles WebSocket authentication.
#         Extracts the token from the query string, verifies it, and attaches the user to the scope.
#         Closes the WebSocket if authentication fails.
#         """
#         from urllib.parse import parse_qs
#         from django.contrib.auth import get_user_model
#         User = get_user_model()

#         query_string = scope.get('query_string', b'').decode('utf-8')
#         query_params = parse_qs(query_string)
#         token = query_params.get('token', [None])[0]

#         if token:
#             username = await self.verify_token(token)
#             if username:
#                 scope['user'] = await get_user_from_token(username)
#             else:
#                 logger.warning("Invalid or expired token for WebSocket connection.")
#                 await send({'type': 'websocket.close', 'code': 4001})
#                 return
#         else:
#             logger.warning("No token provided for WebSocket connection.")
#             await send({'type': 'websocket.close', 'code': 4001})
#             return

#     async def handle_http(self, headers):
#         """
#         Handles HTTP authentication.
#         Extracts the token from the Authorization header, verifies it, and attaches the user to the request.
#         Returns an HTTP response with an error if authentication fails.
#         """
#         from django.contrib.auth import get_user_model
#         User = get_user_model()

#         auth_header = headers.get('Authorization')
#         print("Authorization: ", auth_header)
#         if not auth_header or not auth_header.startswith('Bearer '):
#             return JsonResponse({'error': 'No token provided'}, status=401)

#         token = auth_header.split(' ')[1]
#         username = await self.verify_token(token)

#         if username:
#             request.user = await get_user_from_token(username)
#         else:
#             return JsonResponse({'error': 'Invalid or expired token'}, status=401)

#     async def __call__(self, scope, receive=None, send=None):
#         """Entry point for WebSocket and HTTP requests."""
#         print("@@@@@@@@@@@@@@@@@@@@@@@  TOKEN: HA PASADO POR MIDDLEWARE @@@@@@@@@@@@@@@@@")
#         print("SCOPE: ", scope)
#         # Import models or settings here, not globally
#         # User = apps.get_model('auth', 'User')  # Example
#         query_string = scope.get('query_string', b'').decode('utf-8')
#         query_params = parse_qs(query_string)
#         token = query_params.get('token', [None])[0]
#         print("Query string:", query_string)
#         if scope['type'] == 'http':
#             # For HTTP requests
#             response = await self.handle_http(dict(scope['headers']))
#             if response:
#                 return response
#             return await self.get_response(scope)

#         elif scope['type'] == 'websocket':
#             # For WebSocket connections
#             await self.handle_websocket(scope, receive, send)

# # Middleware wrapper for Django Channels
# def JwtAuthMiddlewareStack(inner):
#     """
#     Middleware wrapper for Django Channels to support WebSocket connections.
#     Wraps the WebSocket routing with JwtAuthMiddleware.
#     """
#     return JwtAuthMiddleware(AuthMiddlewareStack(inner))



# class JwtAuthMiddleware:
#     """
#     ASGI middleware to authenticate HTTP requests using a JWT token.
#     The token is sent to an external service for validation.
#     """

#     def __init__(self, app):
#         self.app = app

#     async def __call__(self, scope, receive, send):
#         # Process HTTP requests only
#         if scope['type'] == 'http':
#             headers = dict(scope['headers'])

#             # Extract the Authorization header
#             auth_header = headers.get(b'authorization')
#             if not auth_header:
#                 return await self.reject_request(send, 'No token provided')

#             auth_header = auth_header.decode('utf-8')
#             if not auth_header.startswith('Bearer '):
#                 return await self.reject_request(send, 'Invalid Authorization header format')

#             token = auth_header.split(' ')[1]

#             # Verify the token with the external service
#             async with aiohttp.ClientSession() as session:
#                 try:
#                     async with session.post(
#                         'http://login:8000/api/verify_token/',
#                         headers={'Authorization': f'Bearer {token}'}
#                     ) as resp:
#                         if resp.status == 200:
#                             data = await resp.json()
#                             username = data.get('user')  # Assuming 'user' is part of the response
#                             if username:
#                                 # Add the user to the scope for later use
#                                 scope['user'] = username
#                             else:
#                                 return await self.reject_request(send, 'Invalid token response')
#                         else:
#                             return await self.reject_request(send, 'Token verification failed', resp.status)

#                 except aiohttp.ClientError as e:
#                     return await self.reject_request(send, f'Error communicating with auth service: {str(e)}', 500)

#         # Default to AnonymousUser if no user is set
#         scope.setdefault('user', AnonymousUser())

#         # Pass the scope to the next application in the stack
#         return await self.app(scope, receive, send)

#     @staticmethod
#     async def reject_request(send, message, status=401):
#         """
#         Send an HTTP rejection response with a given status and message.
#         """
#         await send({
#             'type': 'http.response.start',
#             'status': status,
#             'headers': [(b'content-type', b'application/json')],
#         })
#         await send({
#             'type': 'http.response.body',
#             'body': JsonResponse({'error': message}).content,
#         })


# # Middleware Wrapper
# def JwtAuthMiddlewareStack(app):
#     return JwtAuthMiddleware(app)

###############################################################
##############################################################
###############################################################
#############################################################################################################################
##############################################################
###############################################################
##############################################################
###############################################################
##############################################################

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
import requests
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
        print("header: ", headers)
        req = requests.get("http://localhost:8000/api/verify-token/", headers=headers)
        if req.status_code == 200:
            print("Passed with success: ", username)
            username = req.json()['user']
            if username:
                try:
                    user = Users.objects.get(username=username)
                    return (user, None)
                except Users.DoesNotExist:
                    raise AuthenticationFailed('Invalid or expired token')
        raise AuthenticationFailed('Invalid or expired token')
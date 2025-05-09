from urllib.parse import parse_qs
import logging
from asgiref.sync import sync_to_async
from channels.auth import AuthMiddlewareStack
from django.core.exceptions import ObjectDoesNotExist
import aiohttp
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from django.contrib.auth import get_user_model

USER_MGMT_PORT = settings.USER_MGMT_PORT
PROTOCOL_WEB = settings.PROTOCOL_WEB

logger = logging.getLogger(__name__)

# Fetch user from database using sync-to-async
async def get_user_from_token(username):
    User = get_user_model()
    try:
        return await sync_to_async(User.objects.get)(username=username)
    except ObjectDoesNotExist:
        raise AuthenticationFailed('Invalid or expired token')

# Middleware for WebSocket
class JwtAuthMiddleware:
    
    def __init__(self, inner):
        """
        Initializes the middleware. 
        For HTTP requests, `get_response` is the next middleware in the chain.
        """
        self.inner = inner

    async def verify_token(self, token):
        """
        Verifies a JWT token with an external service.
        Sends an asynchronous HTTP request and returns the username if the token is valid.
        Returns None if the token is invalid or the service fails.
        """
        headers = {"Authorization": f"Bearer {token}"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(PROTOCOL_WEB + "://user-mgmt:" + USER_MGMT_PORT + "/api/user-mgmt/verify-token/", headers=headers, ssl=False) as resp:
                    if resp.status == 200:
                        json_resp = await resp.json()
                        return json_resp.get('user')  # Returns username if valid
                    else:
                        logger.info(f"Token verification failed with status: {resp.status}")
                        return None
        except aiohttp.ClientError as e:
            logger.info(f"HTTP error during token verification: {e}")
            return None

    
    async def __call__(self, scope, receive=None, send=None):
        """Entry point for WebSocket and HTTP requests."""
        #print("@@@@@@@@@@@@@@@@@@@@@@@  TOKEN: HA PASADO POR MIDDLEWARE @@@@@@@@@@@@@@@@@")
        #print("SCOPE: ", scope)

        try:
            logger.info("@@@@@@@@@@@@@@@@@@@@@@@  0!!!!!!!!!!!!!!!!!!!!!!!!!! @@@@@@@@@@@@@@@@@")
            query_string = scope.get('query_string', b'').decode('utf-8')
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]
            logger.info("@@@@@@@@@@@@@@@@@@@@@@@  1!!!!!!!!!!!!!!!!!!!!!!!!!! @@@@@@@@@@@@@@@@@")
            if token:
                #print("@@@@@@@@@@@@@@@@@@@@@@@  2!!!!!!!!!!!!!!!!!!!!!!!!!! @@@@@@@@@@@@@@@@@")
                username = await self.verify_token(token)
                if username:
                    scope['user'] = await get_user_from_token(username)
                    logger.info(f"USER FOUND: {scope['user']}")
                else:
                    logger.info("Invalid or expired token for WebSocket connection.")
                    await send({'type': 'websocket.close', 'code': 4001})
                    return
            else:
                logger.info("No token provided for WebSocket connection.")
                await send({'type': 'websocket.close', 'code': 4001})
                return

            return await self.inner(scope, receive, send)

        except AuthenticationFailed as e:
            logger.error(f"Authentication failed: {e}")
            close_message = {
                'type': 'websocket.close',
                'code': 4001
            }
            await send(close_message)
        except Exception as e:
            logger.info(f"Unexpected error middleware: {e}")
            close_message = {
                'type': 'websocket.close',
                'code': 4000
            }
            await send(close_message)

# Middleware wrapper for Django Channels
def JwtAuthMiddlewareStack(inner):
    """
    Middleware wrapper for Django Channels to support WebSocket connections.
    Wraps the WebSocket routing with JwtAuthMiddleware.
    """
    return JwtAuthMiddleware(AuthMiddlewareStack(inner))

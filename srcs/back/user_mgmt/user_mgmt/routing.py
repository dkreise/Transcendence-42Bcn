from django.urls import re_path
from user_profile import consumers
from django.conf import settings

PROTOCOL_SOCKET = settings.PROTOCOL_SOCKET

websocket_urlpatterns = [
    re_path(
        rf"{PROTOCOL_SOCKET}/online-status/$", 
        consumers.FriendsConsumer.as_asgi()
    ),
]
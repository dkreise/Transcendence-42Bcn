from django.urls import re_path
from . import consumers
from django.conf import settings

PROTOCOL_SOCKET = settings.PROTOCOL_SOCKET

websocket_urlpatterns = [
    re_path(
        rf'{PROTOCOL_SOCKET}/pong/$', consumers.PongConsumer.as_asgi()
    ),
]

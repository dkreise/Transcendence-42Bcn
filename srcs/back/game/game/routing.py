from django.urls import re_path
from .consumers import PongConsumer

websocket_urlpatterns = [
    re_path(r'^ws/ping_pong/$', PongConsumer.as_asgi()),
]
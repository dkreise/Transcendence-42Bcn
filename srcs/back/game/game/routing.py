from django.urls import re_path
from ping_pong.consumers import PongConsumer

websocket_urlpatterns = [
    re_path(r'^ws/ping_pong/(?P<room>\w+)/$', PongConsumer.as_asgi()),
]

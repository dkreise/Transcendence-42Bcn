from django.urls import re_path
# from user_mgmt.middleware import JwtAuthMiddleware
from user_profile import consumers

websocket_urlpatterns = [
    re_path(r"ws/online-status/$", consumers.FriendsConsumer.as_asgi()),
]
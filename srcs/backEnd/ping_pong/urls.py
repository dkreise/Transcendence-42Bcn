# ping_pong/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),  # Ensure 'index' is the correct view function name
]


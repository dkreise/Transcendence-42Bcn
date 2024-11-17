from django.urls import path
from .views import match

urlpatterns = [
    path('', match, name='match'),
]
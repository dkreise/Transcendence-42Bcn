# ping_pong/views.py
from django.shortcuts import render

def index(request):
    return render(request, 'ping_pong/base.html')

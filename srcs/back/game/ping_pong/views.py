from django.shortcuts import render

def match(request):
    return render(request, '../../front/tools/index.html')
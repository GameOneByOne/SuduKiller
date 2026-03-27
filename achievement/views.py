from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.utils import timezone


def achievement_main(request):
    return render(request, "achievement/achievement_panel.html")
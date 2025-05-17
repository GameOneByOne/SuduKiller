from django.shortcuts import render
from django.http import HttpResponse


def SudoMain(request) :
    return render(request, "sudo/index.html")
    # return HttpResponse("This is a sudo web.")

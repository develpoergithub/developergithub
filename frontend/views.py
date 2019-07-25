from django.shortcuts import render
from django.http import HttpResponse
from django.shortcuts import redirect

# Create your views here.


def index(request):
    return render(request, "frontend/index.html")


def error_404_view(request, exception):
    current_path = request.get_full_path()
    return redirect("/#" + current_path)

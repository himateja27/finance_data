"""
Main URL configuration that includes all app URLs.
"""
from django.urls import path, include

urlpatterns = [
    path('records/', include('apps.finance.urls.records')),
]

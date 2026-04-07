"""
Authentication URLs - Login, Register, Logout, Token management.
"""
from django.urls import path
from apps.users.views import (
    RegisterView, LoginView, LogoutView, 
    CurrentUserView, ChangePasswordView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]

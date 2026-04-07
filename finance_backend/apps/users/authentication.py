"""
Custom authentication backend for email-based login.
"""
from django.contrib.auth.backends import BaseBackend
from apps.users.models import User


class EmailBackend(BaseBackend):
    """
    Authentication backend that allows users to log in with their email address.
    """

    def authenticate(self, request, email=None, password=None, **kwargs):
        """
        Authenticate user by email and password.
        """
        if not email or not password:
            return None

        try:
            user = User.objects.get(email=email)
            if user.check_password(password) and user.is_active:
                return user
        except User.DoesNotExist:
            return None

        return None

    def get_user(self, user_id):
        """
        Get user by ID.
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
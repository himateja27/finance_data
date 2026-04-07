"""
Custom authentication for token-based API access.
"""
from rest_framework.authentication import TokenAuthentication as DRFTokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from apps.users.models import Token


class TokenAuthentication(DRFTokenAuthentication):
    """
    Custom token authentication that uses our custom Token model.
    """
    keyword = 'Bearer'
    
    def get_model(self):
        return Token
    
    def authenticate(self, request):
        auth = super().authenticate(request) if super().authenticate(request) else None
        
        if auth is None:
            return None
        
        user, token = auth
        
        # Check if user is active
        if not user.is_active:
            raise AuthenticationFailed('User account is inactive.')
        
        return user, token

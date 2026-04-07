"""
Views for authentication and user management with JWT.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import User, Role
from apps.users.serializers import (
    RegisterSerializer, LoginSerializer, UserDetailSerializer,
    UserListSerializer, ChangePasswordSerializer, RoleSerializer,
    CreateUserSerializer, UpdateUserSerializer
)
from apps.core.permissions import IsAdmin
from apps.core.exceptions import success_response, error_response
from apps.core.utils import log_audit, get_client_ip
from django.utils import timezone


class RegisterView(APIView):
    """Register new user and return JWT tokens."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Register a new user."""
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Log audit
            log_audit(
                user=user,
                action='CREATE',
                content_type='User',
                object_id=user.id,
                description='User registered via API',
                ip_address=get_client_ip(request)
            )
            
            return Response(
                {
                    'tokens': {
                        'access_token': str(refresh.access_token),
                        'refresh_token': str(refresh)
                    },
                    'data': UserDetailSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        
        return error_response(
            'Registration failed',
            'VALIDATION_ERROR',
            status.HTTP_400_BAD_REQUEST,
            serializer.errors
        )


class LoginView(APIView):
    """Login user and return JWT tokens."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Authenticate user and return JWT tokens."""
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Log audit
            log_audit(
                user=user,
                action='LOGIN',
                content_type='User',
                object_id=user.id,
                description='User logged in via API',
                ip_address=get_client_ip(request)
            )
            
            return Response(
                {
                    'tokens': {
                        'access_token': str(refresh.access_token),
                        'refresh_token': str(refresh)
                    },
                    'data': UserDetailSerializer(user).data
                },
                status=status.HTTP_200_OK
            )
        
        return error_response(
            'Invalid credentials',
            'AUTH_ERROR',
            status.HTTP_401_UNAUTHORIZED,
            serializer.errors
        )


class LogoutView(APIView):
    """Logout user and end session."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Logout (in JWT, client simply discards token)."""
        # Log audit
        log_audit(
            user=request.user,
            action='LOGOUT',
            content_type='User',
            object_id=request.user.id,
            description='User logged out',
            ip_address=get_client_ip(request)
        )
        
        return success_response(None, message='Logout successful')


class CurrentUserView(APIView):
    """Get current authenticated user information."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return current user details."""
        return success_response(
            UserDetailSerializer(request.user).data,
            message='User information retrieved'
        )


class ChangePasswordView(APIView):
    """Change user password."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return error_response(
                'Validation failed',
                'VALIDATION_ERROR',
                status.HTTP_400_BAD_REQUEST,
                serializer.errors
            )
        
        # Verify old password
        if not request.user.check_password(serializer.validated_data['old_password']):
            return error_response(
                'Old password is incorrect',
                'AUTH_ERROR',
                status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        # Generate new tokens
        refresh = RefreshToken.for_user(request.user)
        
        # Log audit
        log_audit(
            user=request.user,
            action='UPDATE',
            content_type='User',
            object_id=request.user.id,
            description='User changed password',
            ip_address=get_client_ip(request)
        )
        
        return success_response(
            {
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh)
            },
            message='Password changed successfully'
        )


class UserListCreateView(generics.ListCreateAPIView):
    """List all users (Admin only) or create new user (Admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.select_related('role').all()
    
    def get_serializer_class(self):
        """Choose serializer based on action."""
        if self.request.method == 'POST':
            return CreateUserSerializer
        return UserListSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data, message='Users retrieved')
    
    def create(self, request, *args, **kwargs):
        """Create a new user (Admin only)."""
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Log audit
            log_audit(
                user=request.user,
                action='CREATE',
                content_type='User',
                object_id=user.id,
                description=f'Created user {user.email}',
                ip_address=get_client_ip(request)
            )
            
            return success_response(
                {
                    'user': UserDetailSerializer(user).data,
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh)
                },
                message='User created successfully',
                status_code=status.HTTP_201_CREATED
            )
        
        return error_response(
            'User creation failed',
            'VALIDATION_ERROR',
            status.HTTP_400_BAD_REQUEST,
            serializer.errors
        )


class UserDetailUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific user (Admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.select_related('role').all()
    
    def get_serializer_class(self):
        """Choose serializer based on action."""
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateUserSerializer
        return UserDetailSerializer
    
    def update(self, request, *args, **kwargs):
        """Update user details (Admin only)."""
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Log audit
            log_audit(
                user=request.user,
                action='UPDATE',
                content_type='User',
                object_id=user.id,
                description=f'Updated user {user.email}',
                changes=serializer.data,
                ip_address=get_client_ip(request)
            )
            
            return success_response(
                UserDetailSerializer(user).data,
                message='User updated successfully'
            )
        
        return error_response(
            'User update failed',
            'VALIDATION_ERROR',
            status.HTTP_400_BAD_REQUEST,
            serializer.errors
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a user - soft delete (Admin only)."""
        user = self.get_object()
        user.is_active = False
        user.save()
        
        # Log audit
        log_audit(
            user=request.user,
            action='DELETE',
            content_type='User',
            object_id=user.id,
            description=f'Deactivated user {user.email}',
            ip_address=get_client_ip(request)
        )
        
        return success_response(None, message='User deactivated successfully')


class RoleListView(generics.ListAPIView):
    """List all available roles."""
    permission_classes = [IsAuthenticated]
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data, message='Roles retrieved')

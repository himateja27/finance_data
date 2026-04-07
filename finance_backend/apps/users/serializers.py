"""
Serializers for User and Authentication endpoints.
"""
from rest_framework import serializers
from apps.users.models import User, Role
from django.utils import timezone
from datetime import timedelta


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for Role model."""
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'description',
            'can_view_records', 'can_create_records', 'can_update_records',
            'can_delete_records', 'can_view_analytics', 'can_manage_users',
            'can_view_audit_logs'
        ]
        read_only_fields = ['id']


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for User details."""
    role = RoleSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for User list view."""
    role = serializers.CharField(source='role.name', read_only=True)
    role_display = serializers.CharField(source='role.get_name_display', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'role_display', 'is_active', 'created_at', 'last_login']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=['viewer', 'analyst', 'admin'], default='viewer', required=False)
    
    def validate(self, data):
        """Validate registration data."""
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'Email already registered.'})
        
        return data
    
    def create(self, validated_data):
        """Create new user."""
        password = validated_data.pop('password')
        
        # Get role from request or default to viewer
        role_name = validated_data.pop('role', 'viewer')
        role, _ = Role.objects.get_or_create(name=role_name)
        
        user = User.objects.create(
            role=role,
            **validated_data
        )
        user.set_password(password)
        user.save()
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validate login credentials."""
        email = data.get('email')
        password = data.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Invalid credentials.'})
        
        if not user.check_password(password):
            raise serializers.ValidationError({'password': 'Invalid credentials.'})
        
        if not user.is_active:
            raise serializers.ValidationError({'user': 'Account is inactive.'})
        
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(min_length=8, write_only=True)
    
    def validate(self, data):
        """Validate password change request."""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        
        return data


class CreateUserSerializer(serializers.ModelSerializer):
    """Serializer for admin creating users."""
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.CharField(source='role.name')
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'role', 'is_active']
    
    def validate_role(self, value):
        """Validate that role exists."""
        try:
            return Role.objects.get(name=value)
        except Role.DoesNotExist:
            raise serializers.ValidationError('Invalid role.')
    
    def create(self, validated_data):
        """Create new user."""
        password = validated_data.pop('password')
        role = validated_data.pop('role')
        
        user = User.objects.create(role=role, **validated_data)
        user.set_password(password)
        user.save()
        
        return user


class UpdateUserSerializer(serializers.ModelSerializer):
    """Serializer for updating user."""
    role = serializers.CharField(source='role.name')
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'role', 'is_active']
    
    def validate_role(self, value):
        """Validate that role exists."""
        try:
            return Role.objects.get(name=value)
        except Role.DoesNotExist:
            raise serializers.ValidationError('Invalid role.')

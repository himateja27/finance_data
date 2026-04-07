"""
User and Role models for role-based access control.
"""
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.contrib.auth.models import BaseUserManager
import secrets
import hashlib
from apps.core.models import BaseModel


class Role(BaseModel):
    """
    Role model defining permissions and access levels.
    """
    ROLE_CHOICES = (
        ('viewer', 'Viewer'),
        ('analyst', 'Analyst'),
        ('admin', 'Admin'),
    )
    
    name = models.CharField(
        max_length=50,
        unique=True,
        choices=ROLE_CHOICES,
        help_text='Role name (viewer, analyst, admin)'
    )
    description = models.TextField(
        blank=True,
        help_text='Description of this role and its permissions'
    )
    
    # Permissions
    can_view_records = models.BooleanField(default=False)
    can_create_records = models.BooleanField(default=False)
    can_update_records = models.BooleanField(default=False)
    can_delete_records = models.BooleanField(default=False)
    can_view_analytics = models.BooleanField(default=False)
    can_manage_users = models.BooleanField(default=False)
    can_view_audit_logs = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return f"{self.get_name_display()}"
    
    @staticmethod
    def initialize_default_roles():
        """
        Create default roles with strict permissions.
        - Viewer: Can only view records
        - Analyst: Can view records and summaries
        - Admin: Can do everything (create, update, delete, manage users)
        """
        roles_data = {
            'viewer': {
                'description': 'Can only view records. No create, update, delete, or summary access.',
                'permissions': {
                    'can_view_records': True,
                    'can_create_records': False,
                    'can_update_records': False,
                    'can_delete_records': False,
                    'can_view_analytics': False,
                    'can_manage_users': False,
                    'can_view_audit_logs': False,
                }
            },
            'analyst': {
                'description': 'Can view records and view summaries. No create, update, delete, or user access.',
                'permissions': {
                    'can_view_records': True,
                    'can_create_records': False,
                    'can_update_records': False,
                    'can_delete_records': False,
                    'can_view_analytics': True,
                    'can_manage_users': False,
                    'can_view_audit_logs': False,
                }
            },
            'admin': {
                'description': 'Full access - can create, update, delete, manage users, and view everything.',
                'permissions': {
                    'can_view_records': True,
                    'can_create_records': True,
                    'can_update_records': True,
                    'can_delete_records': True,
                    'can_view_analytics': True,
                    'can_manage_users': True,
                    'can_view_audit_logs': True,
                }
            },
        }
        
        for role_name, role_info in roles_data.items():
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={
                    'description': role_info['description'],
                    **role_info['permissions']
                }
            )
            if created:
                print(f"Created role: {role_name}")


class UserManager(BaseUserManager):
    """
    Custom manager for User model.
    """
    def create_user(self, email, first_name, last_name, password=None, role=None, **extra_fields):
        """
        Create and save a regular user.
        """
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        
        if role is None:
            role, _ = Role.objects.get_or_create(name='viewer')
        
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        """
        Create and save a superuser.
        """
        extra_fields.setdefault('is_active', True)
        
        # Get admin role
        role, _ = Role.objects.get_or_create(name='admin')
        
        return self.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            role=role,
            **extra_fields
        )


class User(BaseModel):
    """
    Custom user model for the finance system.
    """
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    password = models.CharField(max_length=255)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='users')
    is_active = models.BooleanField(default=True, db_index=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Required for Django's User model compatibility
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
            models.Index(fields=['role', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.email} ({self.role.get_name_display()})"
    
    def set_password(self, raw_password):
        """Hash and set the password."""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check if the provided password matches the stored hash."""
        return check_password(raw_password, self.password)
    
    def save(self, *args, **kwargs):
        """Override save to ensure password is hashed if it's plain text."""
        if self.password and not self.password.startswith('pbkdf2_sha256$'):
            self.set_password(self.password)
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        """Return the user's short name."""
        return self.first_name
    
    @property
    def is_anonymous(self):
        """Always return False. This is a logged-in user."""
        return False
    
    @property
    def is_authenticated(self):
        """Always return True. This is an authenticated user."""
        return True
    
    def has_perm(self, perm, obj=None):
        """Check if user has a specific permission."""
        return self.role and getattr(self.role, f'can_{perm}', False)
    
    def has_perms(self, perm_list, obj=None):
        """Check if user has all permissions in the list."""
        return all(self.has_perm(perm) for perm in perm_list)
    
    def has_module_perms(self, app_label):
        """Check if user has permissions for the given app."""
        return True  # For simplicity, allow all apps
    
    def has_permission(self, permission_name):
        """
        Check if user has a specific permission.
        
        Args:
            permission_name: Name of the permission (e.g., 'can_view_records')
        
        Returns:
            Boolean indicating if user has the permission
        """
        return getattr(self.role, permission_name, False)


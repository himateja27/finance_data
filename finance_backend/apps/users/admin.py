from django.contrib import admin
from apps.users.models import User, Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description')
        }),
        ('Permissions', {
            'fields': (
                'can_view_records', 'can_create_records', 'can_update_records',
                'can_delete_records', 'can_view_analytics', 'can_manage_users',
                'can_view_audit_logs'
            )
        }),
    )


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'get_full_name', 'role', 'is_active', 'created_at', 'last_login']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    
    fieldsets = (
        ('Personal Info', {
            'fields': ('email', 'first_name', 'last_name', 'password')
        }),
        ('Role & Status', {
            'fields': ('role', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_login'),
            'classes': ('collapse',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'

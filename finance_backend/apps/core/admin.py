from django.contrib import admin
from apps.core.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'content_type', 'created_at']
    list_filter = ['action', 'created_at', 'content_type']
    search_fields = ['user__email', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False

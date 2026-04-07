"""
Utility functions for core functionality.
"""
from apps.core.models import AuditLog


def log_audit(user, action, content_type, object_id, description='', changes=None, ip_address=None):
    """
    Log an audit action to the database.
    
    Args:
        user: The user performing the action
        action: The action type (CREATE, UPDATE, DELETE, VIEW, LOGIN)
        content_type: The type of object being acted upon
        object_id: The ID of the object
        description: Optional description of the action
        changes: Optional dict of changes made
        ip_address: Optional IP address of the user
    """
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            content_type=content_type,
            object_id=object_id,
            description=description,
            changes=changes or {},
            ip_address=ip_address
        )
    except Exception as e:
        print(f"Error logging audit: {str(e)}")


def get_client_ip(request):
    """
    Get the client's IP address from the request.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

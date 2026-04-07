"""
Permissions and role-based access control.
Strict enforcement of role permissions:
- Viewer: View records only
- Analyst: View records + View summaries
- Admin: All operations
"""
from rest_framework.permissions import BasePermission


class IsViewer(BasePermission):
    """Viewer role - can only view records."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role.name == 'viewer'


class IsAnalyst(BasePermission):
    """Analyst role - can view records and summaries."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role.name == 'analyst'


class IsAdmin(BasePermission):
    """Admin role - full access to all operations."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role.name == 'admin'


class CanViewRecords(BasePermission):
    """Viewer, Analyst, and Admin can view records."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role.name in ['viewer', 'analyst', 'admin']


class CanViewSummaries(BasePermission):
    """Viewer, Analyst, and Admin can view summaries."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role.name in ['viewer', 'analyst', 'admin']


class CanCreateRecords(BasePermission):
    """Only Admin can create records."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role.name == 'admin'


class CanUpdateDeleteRecords(BasePermission):
    """Only Admin can update or delete records."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role.name == 'admin'


class CanManageUsers(BasePermission):
    """Only Admin can manage users."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role.name == 'admin'


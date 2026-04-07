"""
User Management URLs - Create, List, Update users.
"""
from django.urls import path
from apps.users.views import (
    UserListCreateView, UserDetailUpdateView,
    RoleListView
)

urlpatterns = [
    path('', UserListCreateView.as_view(), name='user-list-create'),
    path('<int:pk>/', UserDetailUpdateView.as_view(), name='user-detail-update'),
    path('roles/', RoleListView.as_view(), name='role-list'),
]

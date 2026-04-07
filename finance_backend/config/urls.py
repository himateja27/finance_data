"""
URL configuration for finance_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls.auth')),
    path('api/users/', include('apps.users.urls.users')),
    path('api/finance/records/', include('apps.finance.urls.records')),
    path('api/finance/budgets/', include('apps.finance.urls.budgets')),
    path('api/dashboard/', include('apps.finance.urls.dashboard')),
    path('health/', TemplateView.as_view(template_name='health.html'), name='health-check'),
]

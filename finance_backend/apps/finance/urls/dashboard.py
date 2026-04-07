"""
Dashboard summary APIs URLs.
"""
from django.urls import path
from apps.finance.views import (
    DashboardSummaryView, CategorySummaryView, MonthlyTrendsView,
    RecentsActivityView
)

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('category-summary/', CategorySummaryView.as_view(), name='category-summary'),
    path('monthly-trends/', MonthlyTrendsView.as_view(), name='monthly-trends'),
    path('recent-activity/', RecentsActivityView.as_view(), name='recent-activity'),
]

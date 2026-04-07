"""
Financial records URLs.
"""
from django.urls import path
from apps.finance.views import (
    FinancialRecordListCreateView, FinancialRecordDetailView,
    RecordStatsView
)

urlpatterns = [
    path('', FinancialRecordListCreateView.as_view(), name='record-list-create'),
    path('<int:pk>/', FinancialRecordDetailView.as_view(), name='record-detail'),
    path('stats/', RecordStatsView.as_view(), name='record-stats'),
]

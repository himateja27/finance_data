"""
Views for financial records management and dashboard.
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q, Count, F
from django.utils import timezone
from django.forms.models import model_to_dict
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from apps.finance.models import FinancialRecord, Budget, CashFlow
from apps.finance.serializers import (
    FinancialRecordListSerializer, FinancialRecordDetailSerializer,
    FinancialRecordCreateUpdateSerializer, BudgetSerializer,
    BudgetCreateUpdateSerializer, CashFlowSerializer
)
from apps.core.permissions import CanViewRecords, CanViewSummaries, CanCreateRecords, CanUpdateDeleteRecords
from apps.core.exceptions import success_response, error_response
from apps.core.utils import log_audit, get_client_ip


class FinancialRecordListCreateView(generics.ListCreateAPIView):
    """
    List financial records for authenticated user or create new record.
    
    GET /api/finance/records/?category=salary&record_type=income&date_from=2024-01-01&date_to=2024-12-31
    POST /api/finance/records/
    """
    permission_classes = [IsAuthenticated, CanViewRecords]
    serializer_class = FinancialRecordListSerializer
    
    def get_queryset(self):
        """Get records for current user only."""
        queryset = FinancialRecord.objects.filter(
            user=self.request.user,
            is_deleted=False
        ).select_related('user')
        
        # Filtering
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        record_type = self.request.query_params.get('record_type')
        if record_type:
            queryset = queryset.filter(record_type=record_type)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Date range filtering
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(transaction_date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(transaction_date__lte=date_to)
        
        # Search by description or reference
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(reference_number__icontains=search) |
                Q(tags__icontains=search)
            )
        
        return queryset.order_by('-transaction_date')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data, message='Records retrieved')

    def create(self, request, *args, **kwargs):
        """Create a new financial record (Admin only)."""
        # Only Admin can create records
        permission = CanCreateRecords()
        if not permission.has_permission(request, self):
            return error_response(
                'You do not have permission to create records',
                'PERMISSION_DENIED',
                status.HTTP_403_FORBIDDEN
            )
        
        serializer = FinancialRecordCreateUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            record = serializer.save(user=request.user)
            
            # Log audit
            log_audit(
                user=request.user,
                action='CREATE',
                content_type='FinancialRecord',
                object_id=record.id,
                description=f'Created {record.get_record_type_display()} record - {record.amount}',
                ip_address=get_client_ip(request)
            )
            
            return success_response(
                FinancialRecordDetailSerializer(record).data,
                message='Record created successfully',
                status_code=status.HTTP_201_CREATED
            )
        
        return error_response(
            'Record creation failed',
            'VALIDATION_ERROR',
            status.HTTP_400_BAD_REQUEST,
            serializer.errors
        )


class FinancialRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific financial record.
    
    GET /api/finance/records/<id>/
    PATCH /api/finance/records/<id>/
    DELETE /api/finance/records/<id>/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FinancialRecordDetailSerializer
    
    def get_queryset(self):
        """Get records for current user only."""
        return FinancialRecord.objects.filter(
            user=self.request.user,
            is_deleted=False
        ).select_related('user')
    
    def get(self, request, *args, **kwargs):
        """Retrieve a financial record (requires view permission)."""
        permission = CanViewRecords()
        if not permission.has_permission(request, self):
            return error_response(
                'You do not have permission to view records',
                'PERMISSION_DENIED',
                status.HTTP_403_FORBIDDEN
            )
        return super().get(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Update a financial record (Admin only)."""
        permission = CanUpdateDeleteRecords()
        if not permission.has_permission(request, self):
            return error_response(
                'You do not have permission to update records',
                'PERMISSION_DENIED',
                status.HTTP_403_FORBIDDEN
            )
        
        record = self.get_object()
        serializer = FinancialRecordCreateUpdateSerializer(
            record,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            old_data = model_to_dict(record)
            serializer.save()
            
            # Log audit
            log_audit(
                user=request.user,
                action='UPDATE',
                content_type='FinancialRecord',
                object_id=record.id,
                description=f'Updated financial record - {record.amount}',
                changes=serializer.data,
                ip_address=get_client_ip(request)
            )
            
            return success_response(
                FinancialRecordDetailSerializer(record).data,
                message='Record updated successfully'
            )
        
        return error_response(
            'Record update failed',
            'VALIDATION_ERROR',
            status.HTTP_400_BAD_REQUEST,
            serializer.errors
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a financial record (soft delete, Admin only)."""
        permission = CanUpdateDeleteRecords()
        if not permission.has_permission(request, self):
            return error_response(
                'You do not have permission to delete records',
                'PERMISSION_DENIED',
                status.HTTP_403_FORBIDDEN
            )
        
        record = self.get_object()
        record.soft_delete()
        
        # Log audit
        log_audit(
            user=request.user,
            action='DELETE',
            content_type='FinancialRecord',
            object_id=record.id,
            description=f'Deleted financial record - {record.amount}',
            ip_address=get_client_ip(request)
        )
        
        return success_response(None, message='Record deleted successfully')


class RecordStatsView(APIView):
    """
    Get statistics for financial records (Analyst and Admin only).
    
    GET /api/finance/records/stats/?date_from=2024-01-01&date_to=2024-12-31
    """
    permission_classes = [IsAuthenticated, CanViewSummaries]
    
    def get(self, request):
        """Get record statistics."""
        queryset = FinancialRecord.objects.filter(
            user=request.user,
            is_deleted=False,
            status='completed'
        )
        
        # Date range filtering
        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(transaction_date__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(transaction_date__lte=date_to)
        
        # Calculate stats
        totals = queryset.aggregate(
            total_income=Sum('amount', filter=Q(record_type='income')),
            total_expense=Sum('amount', filter=Q(record_type='expense')),
            total_records=Count('id'),
        )
        
        stats = {
            'total_income': float(totals['total_income'] or 0),
            'total_expense': float(totals['total_expense'] or 0),
            'net_balance': float((totals['total_income'] or 0) - (totals['total_expense'] or 0)),
            'total_records': totals['total_records'],
            'average_transaction': float(
                (totals['total_income'] or 0 + totals['total_expense'] or 0) /
                (totals['total_records'] or 1)
            ) if totals['total_records'] else 0,
        }
        
        return success_response(stats, message='Record statistics retrieved')


class BudgetListCreateView(generics.ListCreateAPIView):
    """
    List budgets for authenticated user or create new budget.
    
    GET /api/finance/budgets/?category=salary&month=2024-01-01
    POST /api/finance/budgets/
    """
    permission_classes = [IsAuthenticated, CanViewRecords]
    serializer_class = BudgetSerializer
    
    def get_queryset(self):
        """Get budgets for current user only."""
        queryset = Budget.objects.filter(user=self.request.user)
        
        # Filtering
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        month = self.request.query_params.get('month')
        if month:
            queryset = queryset.filter(month__gte=month)
        
        return queryset.order_by('-month')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data, message='Budgets retrieved')

    def create(self, request, *args, **kwargs):
        """Create a new budget (Admin only)."""
        permission = CanCreateRecords()
        if not permission.has_permission(request, self):
            return error_response(
                'You do not have permission to create budgets',
                'PERMISSION_DENIED',
                status.HTTP_403_FORBIDDEN
            )
        
        serializer = BudgetCreateUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            budget = serializer.save(user=request.user)
            
            # Log audit
            log_audit(
                user=request.user,
                action='CREATE',
                content_type='Budget',
                object_id=budget.id,
                description=f'Created budget for {budget.category} - {budget.limit_amount}',
                ip_address=get_client_ip(request)
            )
            
            return success_response(
                BudgetSerializer(budget).data,
                message='Budget created successfully',
                status_code=status.HTTP_201_CREATED
            )
        
        return error_response(
            'Budget creation failed',
            'VALIDATION_ERROR',
            status.HTTP_400_BAD_REQUEST,
            serializer.errors
        )


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific budget.
    
    GET /api/finance/budgets/<id>/
    PATCH /api/finance/budgets/<id>/
    DELETE /api/finance/budgets/<id>/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BudgetSerializer
    
    def get_queryset(self):
        """Get budgets for current user only."""
        return Budget.objects.filter(user=self.request.user)
    
    def get(self, request, *args, **kwargs):
        """Retrieve a budget (requires view permission)."""
        permission = CanViewRecords()
        if not permission.has_permission(request, self):
            return error_response(
                'You do not have permission to view budgets',
                'PERMISSION_DENIED',
                status.HTTP_403_FORBIDDEN
            )
        return super().get(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Update a budget (Admin only)."""
        permission = CanUpdateDeleteRecords()
        if not permission.has_permission(request, self):
            return error_response(
                'You do not have permission to update budgets',
                'PERMISSION_DENIED',
                status.HTTP_403_FORBIDDEN
            )
        
        budget = self.get_object()
        serializer = BudgetCreateUpdateSerializer(
            budget,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Log audit
            log_audit(
                user=request.user,
                action='UPDATE',
                content_type='Budget',
                object_id=budget.id,
                description=f'Updated budget for {budget.category}',
                changes=serializer.data,
                ip_address=get_client_ip(request)
            )
            
            return success_response(
                BudgetSerializer(budget).data,
                message='Budget updated successfully'
            )
        
        return error_response(
            'Budget update failed',
            'VALIDATION_ERROR',
            status.HTTP_400_BAD_REQUEST,
            serializer.errors
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a budget (Admin only)."""
        permission = CanUpdateDeleteRecords()
        if not permission.has_permission(request, self):
            return error_response(
                'You do not have permission to delete budgets',
                'PERMISSION_DENIED',
                status.HTTP_403_FORBIDDEN
            )
        
        budget = self.get_object()
        budget_id = budget.id
        budget.delete()
        
        # Log audit
        log_audit(
            user=request.user,
            action='DELETE',
            content_type='Budget',
            object_id=budget_id,
            description=f'Deleted budget',
            ip_address=get_client_ip(request)
        )
        
        return success_response(None, message='Budget deleted successfully')


# Dashboard Views
class DashboardSummaryView(APIView):
    """
    Get dashboard summary with total income, expenses, and balance (Analyst and Admin only).
    
    GET /api/dashboard/summary/?period=month
    """
    permission_classes = [IsAuthenticated, CanViewSummaries]
    
    def get(self, request):
        """Get dashboard summary."""
        period = request.query_params.get('period', 'all')
        
        queryset = FinancialRecord.objects.filter(
            user=request.user,
            is_deleted=False,
            status='completed'
        )
        
        # Filter by period
        if period == 'month':
            first_day = timezone.now().replace(day=1)
            queryset = queryset.filter(transaction_date__gte=first_day)
        elif period == 'week':
            week_ago = timezone.now().date() - timedelta(days=7)
            queryset = queryset.filter(transaction_date__gte=week_ago)
        elif period == 'year':
            year_ago = timezone.now().year
            queryset = queryset.filter(transaction_date__year=year_ago)
        
        # Calculate totals
        totals = queryset.aggregate(
            total_income=Sum('amount', filter=Q(record_type='income')),
            total_expense=Sum('amount', filter=Q(record_type='expense')),
            record_count=Count('id'),
        )
        
        income = float(totals['total_income'] or 0)
        expense = float(totals['total_expense'] or 0)
        
        summary = {
            'period': period,
            'total_income': income,
            'total_expense': expense,
            'net_balance': income - expense,
            'total_transactions': totals['record_count'],
        }
        
        return success_response(summary, message='Dashboard summary retrieved')


class CategorySummaryView(APIView):
    """
    Get summary grouped by category (Analyst and Admin only).
    
    GET /api/dashboard/category-summary/?record_type=expense&period=month
    """
    permission_classes = [IsAuthenticated, CanViewSummaries]
    
    def get(self, request):
        """Get category-wise summary."""
        record_type = request.query_params.get('record_type', 'expense')
        period = request.query_params.get('period', 'month')
        
        queryset = FinancialRecord.objects.filter(
            user=request.user,
            record_type=record_type,
            is_deleted=False,
            status='completed'
        )
        
        # Filter by period
        if period == 'month':
            first_day = timezone.now().replace(day=1)
            queryset = queryset.filter(transaction_date__gte=first_day)
        elif period == 'week':
            week_ago = timezone.now().date() - timedelta(days=7)
            queryset = queryset.filter(transaction_date__gte=week_ago)
        elif period == 'year':
            year_ago = timezone.now().year
            queryset = queryset.filter(transaction_date__year=year_ago)
        
        # Group by category
        category_summary = queryset.values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Format response
        categories = []
        for item in category_summary:
            categories.append({
                'category': item['category'],
                'category_display': dict(FinancialRecord.CATEGORY_CHOICES).get(item['category']),
                'total': float(item['total']),
                'count': item['count'],
            })
        
        return success_response(
            {'categories': categories},
            message='Category summary retrieved'
        )


class MonthlyTrendsView(APIView):
    """
    Get monthly trend data for income and expenses (Analyst and Admin only).
    
    GET /api/dashboard/monthly-trends/?months=12
    """
    permission_classes = [IsAuthenticated, CanViewSummaries]
    
    def get(self, request):
        """Get monthly trends."""
        months = int(request.query_params.get('months', 12))
        
        trends = []
        
        # Get last N months
        for i in range(months, -1, -1):
            current_month = timezone.now() - relativedelta(months=i)
            first_day = current_month.replace(day=1)
            if current_month.month == 12:
                last_day = first_day.replace(year=first_day.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = first_day.replace(month=first_day.month + 1, day=1) - timedelta(days=1)
            
            records = FinancialRecord.objects.filter(
                user=request.user,
                transaction_date__gte=first_day,
                transaction_date__lte=last_day,
                is_deleted=False,
                status='completed'
            )
            
            totals = records.aggregate(
                income=Sum('amount', filter=Q(record_type='income')),
                expense=Sum('amount', filter=Q(record_type='expense')),
            )
            
            trends.append({
                'month': first_day.strftime('%Y-%m'),
                'income': float(totals['income'] or 0),
                'expense': float(totals['expense'] or 0),
                'net': float((totals['income'] or 0) - (totals['expense'] or 0)),
            })
        
        return success_response(
            {'trends': trends},
            message='Monthly trends retrieved'
        )


class RecentsActivityView(APIView):
    """
    Get recent financial activity (Analyst and Admin only).
    
    GET /api/dashboard/recent-activity/?limit=10
    """
    permission_classes = [IsAuthenticated, CanViewSummaries]
    
    def get(self, request):
        """Get recent activity."""
        limit = int(request.query_params.get('limit', 10))
        
        records = FinancialRecord.objects.filter(
            user=request.user,
            is_deleted=False
        ).order_by('-created_at')[:limit]
        
        serializer = FinancialRecordListSerializer(records, many=True)
        
        return success_response(
            {'activity': serializer.data},
            message='Recent activity retrieved'
        )

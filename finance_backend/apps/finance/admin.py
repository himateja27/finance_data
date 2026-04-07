from django.contrib import admin
from apps.finance.models import FinancialRecord, Budget, CashFlow


@admin.register(FinancialRecord)
class FinancialRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'record_type', 'category', 'transaction_date', 'status']
    list_filter = ['record_type', 'category', 'status', 'transaction_date']
    search_fields = ['user__email', 'description', 'reference_number']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Transaction Details', {
            'fields': ('amount', 'record_type', 'category', 'status', 'transaction_date')
        }),
        ('Additional Info', {
            'fields': ('description', 'tags', 'reference_number')
        }),
        ('System', {
            'fields': ('is_deleted', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'limit_amount', 'month', 'is_active']
    list_filter = ['category', 'month', 'is_active']
    search_fields = ['user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ['user', 'month']
        return self.readonly_fields


@admin.register(CashFlow)
class CashFlowAdmin(admin.ModelAdmin):
    list_display = ['user', 'month', 'total_income', 'total_expense', 'net_balance']
    list_filter = ['month']
    search_fields = ['user__email']
    readonly_fields = ['created_at', 'updated_at', 'total_income', 'total_expense', 'net_balance']
    
    def has_add_permission(self, request):
        return False

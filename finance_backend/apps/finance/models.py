"""
Financial records models.
"""
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel
from apps.users.models import User


class FinancialRecord(BaseModel):
    """
    Model for storing financial records/transactions.
    """
    RECORD_TYPE_CHOICES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )
    
    CATEGORY_CHOICES = (
        ('salary', 'Salary'),
        ('bonus', 'Bonus'),
        ('investment', 'Investment'),
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('food', 'Food'),
        ('transportation', 'Transportation'),
        ('entertainment', 'Entertainment'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('other', 'Other'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='financial_records')
    
    amount = models.DecimalField(max_digits=15, decimal_places=2, db_index=True)
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES, db_index=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, db_index=True)
    description = models.TextField(blank=True, null=True)
    
    transaction_date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='completed',
        db_index=True
    )
    
    # Metadata
    tags = models.CharField(max_length=255, blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True, unique=True)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['user', '-transaction_date']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['record_type', '-transaction_date']),
            models.Index(fields=['status', '-transaction_date']),
        ]
    
    def __str__(self):
        return f"{self.get_record_type_display()} - {self.amount} ({self.category}) - {self.transaction_date}"
    
    def soft_delete(self):
        """Soft delete the record."""
        self.is_deleted = True
        self.save(update_fields=['is_deleted'])
    
    def restore(self):
        """Restore a soft deleted record."""
        self.is_deleted = False
        self.save(update_fields=['is_deleted'])


class Budget(BaseModel):
    """
    Model for storing user budgets.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=50, choices=FinancialRecord.CATEGORY_CHOICES)
    limit_amount = models.DecimalField(max_digits=15, decimal_places=2)
    month = models.DateField(help_text='First day of the month for which budget applies')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-month']
        unique_together = ['user', 'category', 'month']
        indexes = [
            models.Index(fields=['user', 'month']),
            models.Index(fields=['user', 'category']),
        ]
    
    def __str__(self):
        return f"Budget for {self.user.email} - {self.category} - {self.limit_amount}"
    
    def get_spent_amount(self):
        """Get total spent in this category for this month."""
        from django.db.models import Sum, Q
        first_day = self.month.replace(day=1)
        if self.month.month == 12:
            last_day = first_day.replace(year=first_day.year + 1, month=1, day=1)
        else:
            last_day = first_day.replace(month=first_day.month + 1, day=1)
        last_day = last_day - timezone.timedelta(days=1)
        
        spent = FinancialRecord.objects.filter(
            user=self.user,
            category=self.category,
            record_type='expense',
            transaction_date__gte=first_day,
            transaction_date__lte=last_day,
            status='completed',
            is_deleted=False
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return spent
    
    def get_remaining_amount(self):
        """Get remaining budget for this category."""
        return self.limit_amount - self.get_spent_amount()


class CashFlow(BaseModel):
    """
    Model for tracking monthly cash flow summary.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cash_flows')
    month = models.DateField()
    
    total_income = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_expense = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        ordering = ['-month']
        unique_together = ['user', 'month']
        indexes = [
            models.Index(fields=['user', 'month']),
        ]
    
    def __str__(self):
        return f"CashFlow for {self.user.email} - {self.month}"
    
    def calculate(self):
        """Calculate cash flow for the month."""
        from django.db.models import Sum, Q
        first_day = self.month.replace(day=1)
        if self.month.month == 12:
            last_day = first_day.replace(year=first_day.year + 1, month=1, day=1)
        else:
            last_day = first_day.replace(month=first_day.month + 1, day=1)
        last_day = last_day - timezone.timedelta(days=1)
        
        records = FinancialRecord.objects.filter(
            user=self.user,
            transaction_date__gte=first_day,
            transaction_date__lte=last_day,
            status='completed',
            is_deleted=False
        )
        
        income = records.filter(record_type='income').aggregate(total=Sum('amount'))['total'] or 0
        expense = records.filter(record_type='expense').aggregate(total=Sum('amount'))['total'] or 0
        
        self.total_income = income
        self.total_expense = expense
        self.net_balance = income - expense
        
        return self

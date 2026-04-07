"""
Serializers for financial records.
"""
from rest_framework import serializers
from apps.finance.models import FinancialRecord, Budget, CashFlow


class FinancialRecordListSerializer(serializers.ModelSerializer):
    """Serializer for financial record list view."""
    record_type_display = serializers.CharField(source='get_record_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = FinancialRecord
        fields = [
            'id', 'amount', 'record_type', 'record_type_display', 'category',
            'category_display', 'description', 'transaction_date', 'status',
            'status_display', 'tags', 'reference_number', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FinancialRecordDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed financial record view."""
    record_type_display = serializers.CharField(source='get_record_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = FinancialRecord
        fields = [
            'id', 'user_email', 'amount', 'record_type', 'record_type_display',
            'category', 'category_display', 'description', 'transaction_date',
            'status', 'status_display', 'tags', 'reference_number',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_email', 'created_at', 'updated_at']


class FinancialRecordCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating financial records."""
    
    class Meta:
        model = FinancialRecord
        fields = [
            'amount', 'record_type', 'category', 'description',
            'transaction_date', 'status', 'tags', 'reference_number'
        ]
    
    def validate_amount(self, value):
        """Validate that amount is positive."""
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than 0.')
        return value
    
    def validate_transaction_date(self, value):
        """Validate transaction date is not in the future."""
        from django.utils import timezone
        if value > timezone.now().date():
            raise serializers.ValidationError('Transaction date cannot be in the future.')
        return value


class BudgetSerializer(serializers.ModelSerializer):
    """Serializer for Budget model."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    spent_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_display', 'limit_amount',
            'month', 'is_active', 'spent_amount', 'remaining_amount',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_spent_amount(self, obj):
        return float(obj.get_spent_amount())
    
    def get_remaining_amount(self, obj):
        return float(obj.get_remaining_amount())


class BudgetCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating budgets."""

    month = serializers.DateField(input_formats=['%Y-%m', '%Y-%m-%d'])
    
    class Meta:
        model = Budget
        fields = ['category', 'limit_amount', 'month', 'is_active']
    
    def validate_limit_amount(self, value):
        """Validate that limit is positive."""
        if value <= 0:
            raise serializers.ValidationError('Budget limit must be greater than 0.')
        return value


class CashFlowSerializer(serializers.ModelSerializer):
    """Serializer for CashFlow model."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = CashFlow
        fields = [
            'id', 'user_email', 'month', 'total_income',
            'total_expense', 'net_balance', 'created_at'
        ]
        read_only_fields = ['id', 'user_email', 'created_at']

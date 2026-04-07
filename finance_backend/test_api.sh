#!/bin/bash
# Finance Backend API Testing Script
# This script demonstrates how to test all API endpoints

BASE_URL="http://localhost:8000/api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Finance Backend API Testing${NC}\n"

# ============================================================================
# 1. AUTHENTICATION TESTS
# ============================================================================
echo -e "${BLUE}1. AUTHENTICATION TESTS${NC}"
echo "================================\n"

# Register a new user
echo "1.1 Register User"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "first_name": "Test",
    "last_name": "User",
    "password": "Test12345",
    "password_confirm": "Test12345"
  }')

echo $REGISTER_RESPONSE | j q .

# Extract token from response
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo -e "\n${GREEN}✓ User registered with token:${NC} $TOKEN\n"

# Login
echo "1.2 Login User"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test12345"
  }')

echo $LOGIN_RESPONSE | jq .
echo ""

# Get current user
echo "1.3 Get Current User"
curl -s -X GET "$BASE_URL/auth/me/" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# ============================================================================
# 2. FINANCIAL RECORDS TESTS
# ============================================================================
echo -e "${BLUE}2. FINANCIAL RECORDS TESTS${NC}"
echo "====================================\n"

# Create income record
echo "2.1 Create Income Record"
RECORD_RESPONSE=$(curl -s -X POST "$BASE_URL/finance/records/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": "5000.00",
    "record_type": "income",
    "category": "salary",
    "description": "Monthly salary",
    "transaction_date": "2024-01-31",
    "status": "completed"
  }')

echo $RECORD_RESPONSE | jq .

RECORD_ID=$(echo $RECORD_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "\n${GREEN}✓ Record created with ID:${NC} $RECORD_ID\n"

# Create expense record
echo "2.2 Create Expense Record"
curl -s -X POST "$BASE_URL/finance/records/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": "1500.00",
    "record_type": "expense",
    "category": "rent",
    "description": "Monthly rent",
    "transaction_date": "2024-01-15",
    "status": "completed"
  }' | jq .
echo ""

# List financial records
echo "2.3 List Financial Records"
curl -s -X GET "$BASE_URL/finance/records/?record_type=income" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Get record details
echo "2.4 Get Record Details"
curl -s -X GET "$BASE_URL/finance/records/$RECORD_ID/" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Update record
echo "2.5 Update Record"
curl -s -X PATCH "$BASE_URL/finance/records/$RECORD_ID/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": "5200.00",
    "description": "Salary with bonus"
  }' | jq .
echo ""

# Get record statistics
echo "2.6 Get Record Statistics"
curl -s -X GET "$BASE_URL/finance/records/stats/" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# ============================================================================
# 3. BUDGET TESTS
# ============================================================================
echo -e "${BLUE}3. BUDGET TESTS${NC}"
echo "======================\n"

# Create budget
echo "3.1 Create Budget"
BUDGET_RESPONSE=$(curl -s -X POST "$BASE_URL/finance/budgets/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "category": "food",
    "limit_amount": "500.00",
    "month": "2024-01-01",
    "is_active": true
  }')

echo $BUDGET_RESPONSE | jq .

BUDGET_ID=$(echo $BUDGET_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "\n${GREEN}✓ Budget created with ID:${NC} $BUDGET_ID\n"

# List budgets
echo "3.2 List Budgets"
curl -s -X GET "$BASE_URL/finance/budgets/" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# ============================================================================
# 4. DASHBOARD TESTS
# ============================================================================
echo -e "${BLUE}4. DASHBOARD TESTS${NC}"
echo "======================\n"

# Dashboard summary
echo "4.1 Dashboard Summary (All Time)"
curl -s -X GET "$BASE_URL/dashboard/summary/?period=all" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo "4.2 Dashboard Summary (This Month)"
curl -s -X GET "$BASE_URL/dashboard/summary/?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Category summary
echo "4.3 Category Summary"
curl -s -X GET "$BASE_URL/dashboard/category-summary/?record_type=expense&period=month" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Monthly trends
echo "4.4 Monthly Trends"
curl -s -X GET "$BASE_URL/dashboard/monthly-trends/?months=3" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# Recent activity
echo "4.5 Recent Activity"
curl -s -X GET "$BASE_URL/dashboard/recent-activity/?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# ============================================================================
# 5. PERMISSION TESTS
# ============================================================================
echo -e "${BLUE}5. PERMISSION TESTS${NC}"
echo "======================\n"

# Delete record (depends on role)
echo "5.1 Delete Record (Admin required)"
curl -s -X DELETE "$BASE_URL/finance/records/$RECORD_ID/" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# ============================================================================
# 6. LIST AVAILABLE ROLES
# ============================================================================
echo -e "${BLUE}6. ROLES${NC}"
echo "==========\n"

echo "6.1 List Available Roles"
curl -s -X GET "$BASE_URL/users/roles/" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# ============================================================================
# 7. LOGOUT
# ============================================================================
echo -e "${BLUE}7. LOGOUT${NC}"
echo "===========\n"

echo "7.1 Logout"
curl -s -X POST "$BASE_URL/auth/logout/" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo -e "${GREEN}✓ All tests completed!${NC}"

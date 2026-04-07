@echo off
REM Finance Backend API Testing Script for Windows
REM This script demonstrates how to test all API endpoints

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:8000/api

echo.
echo ============================================================
echo Finance Backend API Testing
echo ============================================================
echo.

REM ============================================================================
REM 1. AUTHENTICATION TESTS
REM ============================================================================
echo.
echo 1. AUTHENTICATION TESTS
echo ====================================
echo.

echo 1.1 Register User
curl -X POST "%BASE_URL%/auth/register/" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"testuser@example.com\", \"first_name\": \"Test\", \"last_name\": \"User\", \"password\": \"Test12345\", \"password_confirm\": \"Test12345\"}"

echo.
echo.
echo 1.2 Login User
curl -X POST "%BASE_URL%/auth/login/" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"testuser@example.com\", \"password\": \"Test12345\"}"

echo.
echo.
REM TODO: Extract token and use it in subsequent requests
echo (Note: Use the token from login response in Authorization header)
echo.

REM ============================================================================
REM 2. FINANCIAL RECORDS - Example with Token
REM ============================================================================
echo.
echo 2. FINANCIAL RECORDS - Example Structure
echo ====================================
echo.
echo To create a record, use:
echo.
echo curl -X POST "%BASE_URL%/finance/records/" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"amount\": \"5000.00\", \"record_type\": \"income\", \"category\": \"salary\", \"description\": \"Monthly salary\", \"transaction_date\": \"2024-01-31\", \"status\": \"completed\"}"
echo.

REM ============================================================================
REM 3. USEFUL ENDPOINTS
REM ============================================================================
echo.
echo 3. USEFUL ENDPOINTS
echo ====================================
echo.
echo Authentication:
echo   POST /api/auth/register/ - Register new user
echo   POST /api/auth/login/ - Login user
echo   GET /api/auth/me/ - Get current user
echo   POST /api/auth/logout/ - Logout user
echo   POST /api/auth/change-password/ - Change password
echo.
echo Financial Records:
echo   GET /api/finance/records/ - List records
echo   POST /api/finance/records/ - Create record
echo   GET /api/finance/records/{id}/ - Get record
echo   PATCH /api/finance/records/{id}/ - Update record
echo   DELETE /api/finance/records/{id}/ - Delete record
echo.
echo Dashboard:
echo   GET /api/dashboard/summary/ - Dashboard summary
echo   GET /api/dashboard/category-summary/ - Category breakdown
echo   GET /api/dashboard/monthly-trends/ - Monthly trends
echo   GET /api/dashboard/recent-activity/ - Recent activity
echo.
echo Budgets:
echo   GET /api/finance/budgets/ - List budgets
echo   POST /api/finance/budgets/ - Create budget
echo.

echo.
echo Testing completed! Check responses above.
echo.
pause

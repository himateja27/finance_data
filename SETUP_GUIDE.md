# 🚀 FinanceHub - Setup Guide

A professional financial management application with **separate** Django backend and React frontend.

## 📋 Overview

**FinanceHub** features role-based access control (Viewer, Analyst, Admin), real-time analytics, transaction management, budget tracking, and user administration.

## 🏗️ Project Structure

**IMPORTANT**: Backend and frontend are completely separate projects:

```
finance_data/
├── finance_backend/     # Django REST API (Port 8000)
│   ├── config/         # Django settings & URLs
│   ├── apps/           # Business logic modules
│   ├── manage.py       # Django management script
│   └── requirements.txt # Python dependencies
│
└── finance_frontend/    # React SPA (Port 3000)
    ├── src/            # React application
    ├── public/         # Static assets
    └── package.json    # Node.js dependencies
```

**❌ NO frontend code should exist in finance_backend/**  
**❌ NO backend code should exist in finance_frontend/**

## 🛠️ Prerequisites

- **Python 3.8+** (Django backend)
- **Node.js 16+** (React frontend)
- **MySQL 8.0+** (Database: `amazon`, User: `root`, Password: `7330870063`)

## ⚙️ Backend Setup

```bash
cd finance_backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## 🎨 Frontend Setup

```bash
cd finance_frontend
npm install
npm start
```

## 🔄 Running Both Servers

**Terminal 1 - Backend:**

```bash
cd finance_backend && python manage.py runserver
```

**Terminal 2 - Frontend:**

```bash
cd finance_frontend && npm start
```

## 👤 User Roles

- **Viewer**: Dashboard access only
- **Analyst**: Records & budget management
- **Admin**: Full system access + user management

## 🎯 Features

### Authentication

- JWT-based login/registration
- Role-based access control
- Secure token management

### Dashboard Analytics

- Financial summary cards (Income/Expense/Net Balance)
- Category breakdown with transaction counts
- Recent activity feed
- Monthly trends analysis

### Records Management (Analyst/Admin)

- Complete CRUD operations
- Advanced filtering (type, category, date)
- Transaction categorization

### Budget Management (Analyst/Admin)

- Budget creation and monitoring
- Real-time spending tracking
- Budget vs. actual comparisons

### User Administration (Admin Only)

- User lifecycle management
- Role assignment and permissions
- User search and filtering

## 🔧 API Endpoints

- `POST /api/auth/login/` - User authentication
- `POST /api/auth/register/` - User registration
- `GET /api/dashboard/summary/` - Financial analytics
- `GET /api/finance/records/` - Transaction records
- `GET /api/finance/budgets/` - Budget management
- `GET /api/users/` - User administration

## 🧪 Testing

1. Visit `http://localhost:3000`
2. Register with desired role
3. Login and test role-specific features
4. Verify dashboard loads analytics
5. Test CRUD operations (Analyst/Admin)

## 🐛 Troubleshooting

### Project Structure Issues

- **"Why is there a frontend folder in backend?"**: This was removed. Keep backend and frontend completely separate.
- **"Should I run npm install in backend?"**: No! Only run in `finance_frontend/`.
- **"Should I run pip install in frontend?"**: No! Only run in `finance_backend/`.

### Common Issues

- **CORS Error**: Ensure backend runs first
- **Database Issues**: Verify MySQL connection
- **Token Errors**: Clear localStorage and re-login
- **Permission Issues**: Check user roles

## 🚀 Production

1. Set `DEBUG=False` in Django
2. Configure production database
3. Build React: `npm run build`
4. Deploy static files

---

**Ready to manage finances professionally! 💰📊**

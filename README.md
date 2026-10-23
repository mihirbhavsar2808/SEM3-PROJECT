# SEM3-PROJECT: Nexora HRM System

A full-stack Human Resource Management (HRM) System built for MScIT Semester 3.

---

## 🚀 Features

- **Dashboard**: Real-time stats, attendance metrics, department breakdowns, and leave analytics.
- **Employee Management**: Manage employee records, roles, departments, designations, and contact info.
- **Attendance Tracking**: Clock in/out, daily attendance logs, work hours, and status tracking.
- **Leave Management**: Leave requests, approvals, balance tracking, and status updates.
- **Payroll**: Salary structures, allowances, deductions, payslip generation, and distribution.
- **Subscriptions & Billing**: Tiered plans, plan management, and billing cycle workflows.
- **Authentication & Security**: JWT-based authentication (SimpleJWT), role-based access control, secure password policies.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: Django & Django REST Framework (DRF)
- **Authentication**: JWT (`djangorestframework-simplejwt`)
- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **CORS**: `django-cors-headers`

### **Frontend**
- **Framework**: React 19 + Vite
- **Routing**: React Router v7
- **UI & Icons**: Lucide React, Custom CSS Design System
- **Charts**: Recharts

---

## 💻 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js (v18+) & npm

### 2. Backend Setup
```bash
cd "Backend/Nexora_hrm"

# (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start backend server (Default: http://127.0.0.1:8000)
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup
```bash
cd "frontend/Nexora_hrm"

# Install dependencies
npm install

# Start Vite dev server (Default: http://localhost:5173)
npm run dev
```

---

## 📂 Project Directory Structure

```
SEM3-PROJECT/
├── Backend/
│   └── Nexora_hrm/
│       ├── accounts/        # User accounts, auth & permissions
│       ├── hrm/             # Core HRM models (Employees, Attendance, Leaves, Payroll)
│       ├── subscriptions/   # Subscription plans & billing
│       ├── Nexora_hrm/      # Django settings and root URLs
│       ├── manage.py
│       └── requirements.txt
├── frontend/
│   └── Nexora_hrm/
│       ├── src/
│       │   ├── api/         # API client & endpoint services
│       │   ├── components/  # Layout & reusable UI components
│       │   ├── pages/       # Dashboard, Employees, Attendance, Payroll, etc.
│       │   ├── constants/   # Theme & style definitions
│       │   └── App.jsx
│       ├── package.json
│       └── vite.config.js
├── postman/                 # API documentation & Postman collections
└── README.md
```

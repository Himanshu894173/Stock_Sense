# StockSense Inventory Management System (Odoo × LPU ERP)

StockSense is a full-stack, real-time Inventory Management System built with **React (Frontend)**, **Python FastAPI (Backend)**, and **SQLAlchemy / PostgreSQL (Database)**.

---

## 🚀 Quick Setup & Run Instructions

### 1. Backend Setup (Python FastAPI)

1. Open terminal in `backend/`:
   ```bash
   cd backend
   python -m venv venv
   ```
2. Activate virtualenv:
   - **Windows**: `.\venv\Scripts\activate`
   - **Linux/Mac**: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run Database Seed Script (optional, populates initial demo data & Page 16 scenario):
   ```bash
   python -m app.seed
   ```
5. Launch FastAPI Backend:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Frontend Setup (React + Vite)

1. Open terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start React Dev Server:
   ```bash
   npm run dev
   ```
- **Web App URL**: [http://localhost:5173](http://localhost:5173)

---

## 🔐 Demo Accounts

- **Inventory Manager**: `admin@stocksense.com` / `admin123`
- **Warehouse Staff**: `staff@stocksense.com` / `staff123`

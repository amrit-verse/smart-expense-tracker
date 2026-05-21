# 💰 Smart Expense Tracker

A full-stack personal finance application built with Node.js, Express.js, MongoDB, and vanilla JavaScript.

---

## 📁 Project Structure

```
smart-expense-tracker/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── package.json
│   ├── .env.example           # Environment variables template
│   ├── models/
│   │   ├── Transaction.js     # Transaction schema (Mongoose)
│   │   └── User.js            # User schema with bcrypt hashing
│   ├── routes/
│   │   ├── auth.js            # POST /register, POST /login, GET /me
│   │   └── transactions.js    # CRUD endpoints for transactions
│   └── middleware/
│       └── auth.js            # JWT authentication middleware
├── frontend/
│   ├── index.html             # Single-page application
│   ├── style.css              # Full responsive styling
│   └── script.js             # All frontend logic + Chart.js
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** v16 or higher — https://nodejs.org
- **MongoDB** (local or cloud) — https://mongodb.com
- **npm** (comes with Node.js)

---

## 🚀 Quick Setup

### Step 1 — Install Dependencies

```bash
cd backend
npm install
```

### Step 2 — Configure Environment

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=your_super_secret_key_change_this
PORT=5000
```

> **Using MongoDB Atlas (cloud)?** Replace MONGO_URI with your connection string:
> `MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_tracker`

### Step 3 — Start the Server

```bash
# Production
node server.js

# Development (auto-restart on file changes)
npm run dev
```

### Step 4 — Open the App

Visit: **http://localhost:5000**

---

## 🔌 REST API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | No | Create new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/transactions` | Yes | Get all transactions (with filters) |
| POST | `/api/transactions/add` | Yes | Add new transaction |
| DELETE | `/api/transactions/delete/:id` | Yes | Delete transaction |
| GET | `/api/transactions/summary` | Yes | Monthly summary aggregation |
| GET | `/api/transactions/categories` | Yes | Category-wise breakdown |

### Query Parameters for GET /transactions

| Param | Example | Description |
|-------|---------|-------------|
| `type` | `income` or `expense` | Filter by type |
| `category` | `Food` | Filter by category (partial match) |
| `month` + `year` | `3&year=2025` | Filter by month |
| `startDate` + `endDate` | `2025-01-01&endDate=2025-03-31` | Date range filter |

### Example API Requests

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"secret123"}'
```

**Add Transaction:**
```bash
curl -X POST http://localhost:5000/api/transactions/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Monthly Salary","amount":50000,"type":"income","category":"Salary","date":"2025-03-01"}'
```

---

## ✨ Features

### Dashboard
- Total income, expense, and balance cards
- Doughnut chart: Income vs Expense
- Bar chart: Monthly overview (last 6 months)
- Recent transactions list

### Transactions
- Add transactions with title, amount, type, category, date, note
- Filter by type, category, month
- Delete individual transactions
- Running totals

### Analytics
- Category-wise expense breakdown (doughnut)
- Category-wise income breakdown (doughnut)
- 6-month trend line chart

### Reports
- Date range filtering
- Print Report (`window.print()`)
- Download PDF (html2pdf.js)
- Export CSV (Excel-compatible)

### Authentication
- Register / Login with JWT
- Passwords hashed with bcrypt
- Protected API routes
- Persistent login (localStorage)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js |
| PDF Export | html2pdf.js |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Fonts | Syne + DM Sans (Google Fonts) |

---

## 🐛 Troubleshooting

**"Connection failed. Is the server running?"**
→ Make sure you've run `npm install` and `node server.js` in the backend folder.

**MongoDB connection error**
→ Ensure MongoDB is running locally: `mongod` or check your Atlas connection string.

**Port 5000 already in use**
→ Change `PORT=5001` in your `.env` file and update the `API` variable in `frontend/script.js`.

---

## 📄 License

MIT — Free to use for academic and personal projects.

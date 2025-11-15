# Getting Started - Stock Taking System v2.0.1

## ⚡ Quick Startup Checklist (30 Seconds)

### Expected State
Both servers running + PostgreSQL connected

### Start the Servers

**Terminal 1: Backend Development Server**
```bash
cd backend && npm run dev
# Expected output: "nodemon restarting due to changes" → "Server running on port 3005"
```

**Terminal 2: Frontend (in a new terminal)**
```bash
cd frontend && npm start
# Expected output: "You can now view frontend in the browser. Local: http://localhost:3000"
```

### ✅ System Ready When You See:
- **Backend**: `Server running on port 3005` + `Master Products API ready`
- **Frontend**: `Compiled successfully!` + `Local: http://localhost:3000`
- **Database**: PostgreSQL running (automatic - Windows Service)
- **Browser**: Navigate to `http://localhost:3000`

---

## Prerequisites

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **PostgreSQL 17** - [Download for Windows](https://www.postgresql.org/download/windows/)

---

## First-Time Setup

### 1. Install PostgreSQL 17

Download and run the PostgreSQL 17 installer for Windows.
During installation, remember your postgres password (or use trust auth for localhost).

### 2. Configure PostgreSQL for Localhost (Optional - Passwordless)

```bash
# Edit: C:/Program Files/PostgreSQL/17/data/pg_hba.conf
# Change all "scram-sha-256" to "trust" for localhost connections
# Restart PostgreSQL service via Windows Services (services.msc)
```

### 3. Create Database

```bash
# Using psql (no password needed if trust auth configured)
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -c "CREATE DATABASE stocktaking_local;"
```

### 4. Apply Database Schema

```bash
# Run the schema SQL file
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d stocktaking_local -f backend/schema.sql
```

### 5. Configure Backend

Edit `backend/.env` (already configured for localhost):
```
DATABASE_URL=postgresql://postgres:@localhost:5432/stocktaking_local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stocktaking_local
DB_USER=postgres
DB_PASS=
```

### 6. Install Dependencies

**Backend:**
```bash
cd backend && npm install
```

**Frontend:**
```bash
cd frontend && npm install
```

---

## Running the Application

### Start Backend (Development)

```bash
cd backend
npm run dev
```

**Features:**
- Uses nodemon to auto-restart on file changes
- Server runs on http://localhost:3005
- Watch for: "nodemon restarting due to changes"

### Start Frontend (in a new terminal)

```bash
cd frontend
npm start
```

**Features:**
- App opens at http://localhost:3000
- Auto-refreshes on file changes

### Verify Everything Works

```bash
# Test backend health
curl http://localhost:3005/api/health
# Should return: {"status":"healthy","database":"connected",...}

# Test frontend
# Open browser: http://localhost:3000
```

---

## ⚠️ Troubleshooting

### PostgreSQL not running?
- Windows Services → search "postgresql-x64-17" → Restart if stopped

### Backend crashed/missing?
```bash
cd backend && npm start
```

### Frontend crashed/missing?
```bash
cd frontend && npm start
```

### Database connection error?
```bash
# Test database connection
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d stocktaking_local -c "SELECT COUNT(*) FROM venues;"
```

### Still broken?
- Check backend `.env` file has: `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=stocktaking_local`
- Check frontend `src/config/api.js` has: `API_BASE_URL = 'http://localhost:3005'`
- Stop the dev server with `Ctrl+C` in the terminal, then run `npm run dev` again
- ⚠️ Do NOT use `taskkill` or `Stop-Process` - these disrupt nodemon's auto-restart behavior

---

## IMPORTANT: Development Server Management

### ✅ DO's:
- **DO** run `npm run dev` in backend terminal (stays running)
- **DO** run `npm start` in frontend terminal (stays running)
- **DO** edit files - changes auto-reload via nodemon and React dev server
- **DO** let nodemon handle restarts automatically
- **DO** use `Ctrl+C` in the terminal if you need to manually stop a server

### ❌ DON'Ts:
- **DO NOT** kill Node processes (`taskkill` or `Stop-Process`)
- **DO NOT** use `npm start` for backend (use `npm run dev` instead)
- **DO NOT** require manual intervention for file changes

**Why?** Killing processes disrupts nodemon's file watchers and auto-restart mechanism.

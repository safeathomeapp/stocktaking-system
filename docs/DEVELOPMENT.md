# Development Workflow & Practices

## Local Development Architecture

**System Architecture:**
- **Fully self-contained localhost application**
- **PostgreSQL 17** - Local database (no cloud dependencies)
- **Node.js Backend** - REST API on port 3005
- **React Frontend** - Development server on port 3000

**API Configuration:**
```javascript
// frontend/src/config/api.js
const API_BASE_URL = 'http://localhost:3005';
// All operations (database + PDF parsing) run locally
```

**Why This Architecture:**
- ✅ **No internet required** - develop completely offline
- ✅ **Fast performance** - no network latency
- ✅ **Safe testing** - experiment without affecting production data
- ✅ **Full control** - own your data, reset anytime
- ✅ **Simple setup** - just PostgreSQL + Node.js

---

## Daily Development Workflow

### 1. Start PostgreSQL
Check Windows Services - `postgresql-x64-17` should be "Running"

### 2. Start Backend with Nodemon (auto-restart on changes)
```bash
cd backend && npm run dev
# Nodemon monitors backend files and auto-restarts on save
```

### 3. Start Frontend (new terminal)
```bash
cd frontend && npm start
# React dev server auto-refreshes on save
```

### 4. Develop!
Changes auto-reload via nodemon and React

**Important Notes:**
- **DO NOT kill Node processes** - let nodemon handle restarts
- **File changes = automatic restart** (no manual intervention needed)
- **Modify a backend file** to trigger nodemon restart if needed

---

## Development Server Management

### ⚠️ IMPORTANT: Development Server Management
- **DO NOT kill Node processes** - Let nodemon handle restarts
- **File changes auto-reload** - Save files to trigger automatic restart
- If backend server appears stuck, modify a backend file to trigger nodemon restart
- Only stop the server if absolutely necessary by pressing `Ctrl+C` in the terminal

### ✅ Correct Way to Stop a Server
```bash
# In the terminal running the server, press:
Ctrl+C
```

### ❌ WRONG - Do Not Use These
```bash
# These break nodemon's auto-restart mechanism:
taskkill /F /IM node.exe
Stop-Process -Name node -Force
```

---

## Database Management

### View All Databases
```bash
psql -U postgres -l
```

### Connect to Stocktaking Database
```bash
psql -U postgres -d stocktaking_local
```

### View All Tables
```bash
\dt
```

### View Venues
```bash
SELECT * FROM venues;
```

### Reset Database (careful!)
```bash
DROP DATABASE stocktaking_local;
CREATE DATABASE stocktaking_local;
psql -U postgres -d stocktaking_local -f backend/schema.sql
```

---

## Common Pitfalls & Anti-Patterns

### ❌ DON'T: Pull product data from venue_products
```javascript
// WRONG - venue_products doesn't have brand, unit_size, etc.
SELECT vp.name, vp.brand, vp.unit_size  -- ❌ brand/unit_size don't exist here
FROM venue_products vp
```

### ✅ DO: Always JOIN to master_products
```javascript
// CORRECT - all product data from master_products
SELECT vp.id, mp.name, mp.brand, mp.unit_size, mp.unit_type, mp.case_size
FROM venue_products vp
LEFT JOIN master_products mp ON vp.master_product_id = mp.id
```

### ❌ DON'T: Create complex tracking systems for simple operations
**Example:** User wants to remove a product from a session.
- **Wrong approach**: Create session_excluded_products table, track exclusions, filter on load
- **Right approach**: Just `DELETE FROM stock_entries WHERE session_id = X AND product_id = Y`

### ✅ DO: Keep solutions simple and direct
- If something can be accomplished with a single DELETE/UPDATE/INSERT, do that
- Avoid creating new tables unless absolutely necessary for data persistence
- Session-specific operations should modify session-specific data (stock_entries), not create parallel tracking systems

### ❌ DON'T: Store duplicate product information
```javascript
// WRONG - duplicating master product data in venue_products
await pool.query(
  'INSERT INTO venue_products (name, brand, unit_size, category) VALUES ($1, $2, $3, $4)',
  [name, brand, unitSize, category]  // ❌ These belong in master_products only
);
```

### ✅ DO: Link to master products, never duplicate
```javascript
// CORRECT - just link to master product
await pool.query(
  'INSERT INTO venue_products (venue_id, master_product_id, name) VALUES ($1, $2, $3)',
  [venueId, masterProductId, venueName]  // ✅ venueName is venue-specific, rest comes from master
);
```

### ❌ DON'T: Assume persistence requirements without asking
- User says "remove product from counting" → Ask: "Should this persist across sessions?"
- Don't automatically build complex solutions for implied requirements

### ✅ DO: Implement exactly what was requested
- "Remove from counting" → Delete from stock_entries (simple, direct)
- If persistence is needed later, user will specify it explicitly

---

## Working with Claude Code

When providing prompts for new features:
1. **Be specific** about data sources (e.g., "use master_products, not venue_products")
2. **Specify simplicity** when desired (e.g., "just delete from stock_entries")
3. **Clarify persistence** requirements (e.g., "session-only" vs "permanent")
4. **Reference this documentation** for architectural principles before implementing
5. **Development server**: Always use `npm run dev` for backend (NOT `npm start`)
6. **Server management**: Let nodemon handle restarts - never kill Node processes
7. **File changes**: Save files to trigger automatic backend restart via nodemon

---

## Development Checklist

1. **Start PostgreSQL** - Ensure service is running (check Windows Services)
2. **Start Backend** - `cd backend && npm run dev` (port 3005, auto-restart on changes)
3. **Start Frontend** - `cd frontend && npm start` (port 3000)
4. **Test locally** - Verify both frontend and backend are working
5. **Make changes** - Code changes auto-reload via nodemon and React dev server
6. **Test database** - Use psql to inspect data if needed
7. **Commit changes** - `git add . && git commit -m "description"`
8. **Push to GitHub** - `git push` (for version control and backup)

---

## Temporary SQL Files - Cleanup Standard

When creating SQL migration or expansion scripts that will only be used once and then discarded, **mark them clearly for safe deletion**:

```sql
-- ============================================
-- TEMPORARY SQL FILE - SAFE TO DELETE
-- ============================================
-- Created: [Date]
-- Purpose: [Brief description]
-- Description: [What it does]
-- Status: ✅ Applied to Database / ❌ Abandoned / 🚀 Pending
-- Cleanup: This file can be safely deleted after [condition]
-- ============================================
```

**Examples of temporary SQL files:**
- Product expansion/bulk inserts (e.g., `add_snacks_softdrinks_v2.sql`)
- Schema migrations (e.g., `migrate_old_schema_to_new.sql`)
- Data cleanup scripts (e.g., `fix_duplicate_products.sql`)
- One-time test data loads

**Files to keep permanently:**
- `backend/schema.sql` - Core database schema
- Any migration files referenced in version control
- Backup/restore scripts

---

## Optional: Backup Your Database

```bash
# Export database to SQL file
pg_dump -U postgres stocktaking_local > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres stocktaking_local < backup_20251020.sql
```

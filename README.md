# Stock Taking System

**Modern tablet-optimized stock-taking system for pubs and restaurants**

A comprehensive React-based system for managing venue inventory with voice recognition, tablet optimization, and professional styled-components UI.

## 🚀 Current Status

**✅ Database & UI Foundation Complete** - *September 2025*

- **Frontend**: React with styled-components, fully responsive design
- **Backend**: Node.js/Express API with PostgreSQL database
- **Database**: Railway-hosted with complete schema and test data
- **Styling**: Professional tablet-optimized UI with touch targets

## 📊 Features

### ✅ Implemented
- **Venue Management**: Complete CRUD operations with structured addresses
- **Stock-Taking Sessions**: Create and manage inventory sessions
- **Product Management**: Organized by categories and venue areas
- **Responsive Design**: Mobile-first with tablet optimization
- **Professional UI**: Styled-components with comprehensive theme system
- **Database**: Complete schema with relationships and constraints

### 🔄 In Development
- **Voice Recognition**: Voice input for stock counting
- **Photo Upload**: Product photo capture capability
- **Session Completion**: Reporting and analytics
- **Invoice Processing**: AWS Textract integration (planned)

## 🏗️ Architecture

```
Frontend (React)          Backend (Node.js)         Database (PostgreSQL)
├── Styled Components  →  ├── Express API        →  ├── Venues
├── Voice Recognition     ├── CORS & Security       ├── Products
├── Tablet Optimization   ├── Error Handling        ├── Sessions
└── Responsive Design     └── JSON Responses        └── Stock Entries
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL (or Railway account)

### Frontend Setup
```bash
cd frontend
npm install
npm start
# Opens on http://localhost:3000
```

### Backend Setup
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Add your DATABASE_URL

# Run database migration
node migrate-db.js

# Add sample data
node fix-products.js

# Start server
npm start
# API runs on http://localhost:3005
```

## 📱 Tablet Optimization

**Touch-First Design**:
- ✅ 44px minimum touch targets
- ✅ Large, easy-to-tap buttons
- ✅ Responsive grid layouts
- ✅ Voice input support (planned)
- ✅ Landscape orientation optimized

**Performance**:
- ✅ 113.32 kB optimized bundle
- ✅ Fast rendering with styled-components
- ✅ Efficient database queries with indexes

## 🗄️ Database Schema

**Core Tables**:
- `venues` - Venue information with structured addresses
- `venue_areas` - Areas within venues (Bar, Storage, Kitchen, etc.)
- `products` - Product catalog with categories and expected counts
- `stock_sessions` - Individual stock-taking sessions
- `stock_entries` - Stock count records

See [`docs/database-schema.md`](docs/database-schema.md) for complete reference.

## 🎨 UI Components

**Styled-Components System**:
- **Theme**: Comprehensive design tokens (colors, spacing, typography)
- **Components**: Card, Form, Layout, Button libraries
- **Responsive**: Mobile-first with tablet and desktop breakpoints
- **Accessible**: Focus states, keyboard navigation, screen reader support

## 🔧 Development

### Available Scripts

**Frontend**:
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

**Backend**:
```bash
npm start          # Start API server
node migrate-db.js # Run database migrations
node check-db.js   # Verify database structure
```

## 🚀 Railway Deployment

### Manual Deployment Process

**🚨 CRITICAL: Complete deployment workflow with server restart**

After pushing changes to GitHub, use these commands to force a redeploy:

```bash
# Step 1: Navigate to project directory
cd /c/users/kevth/desktop/stocktake/stocktaking-system

# Step 2: Commit and push changes to GitHub
git add . && git commit -m "your message" && git push

# Step 3: Deploy to Railway (force redeploy)
railway up --service stocktaking-api --detach

# Step 4: Wait for deployment (approx 50-60 seconds)
sleep 60

# Step 5: Verify deployment shows new version
curl -s "https://stocktaking-api-production.up.railway.app/api/health"
# Should show updated version number

# Step 6: Kill existing frontend server on port 3000
netstat -ano | findstr :3000
# Note the PID (Process ID) from the output
taskkill //PID <process_id> //F

# Step 7: Restart frontend server
cd frontend && npm start
```

**⚠️ IMPORTANT SERVER RESTART WORKFLOW**:
- **Always kill and restart frontend** after Railway deployment
- This ensures frontend uses the latest backend API
- Without restart, frontend may cache old API responses
- Use `netstat -ano | findstr :3000` to find the process ID
- Use `taskkill //PID <id> //F` to force kill the process

**Note**: Railway deployment takes approximately 50-60 seconds. Always wait before testing.

### Development Server Management

**Background Servers**: During development, keep both frontend and backend running in background:

```bash
# Frontend (port 3000) - run in background terminal
cd frontend && npm start

# Backend (port 3005) - run in background terminal
cd backend && npm start
```

**Deployment Workflow**: When committing and deploying changes:

```bash
# Step 1: Commit and push changes
git add . && git commit -m "your message" && git push

# Step 2: Kill existing frontend server (if running on port 3000)
# Find process: netstat -ano | findstr :3000
# Kill process: taskkill /PID <process_id> /F

# Step 3: Deploy to Railway
railway up --service stocktaking-api --detach

# Step 4: Wait for deployment
sleep 60

# Step 5: Restart local frontend (optional)
cd frontend && npm start
```

**Important**: Always kill and restart the frontend server after deployment to ensure you're testing the latest backend changes.

### Database Management
```bash
# Schema migration
node backend/migrate-db.js

# Add sample data
node backend/fix-products.js

# Check database health
node backend/check-db.js
```

## 🌐 API Endpoints

**Core API** (Railway-hosted):
```
GET    /api/health           # System health
GET    /api/venues           # List venues
POST   /api/venues           # Create venue
GET    /api/venues/:id/products    # Venue products
GET    /api/venues/:id/areas       # Venue areas
POST   /api/sessions         # Create session
GET    /api/sessions/:id/entries   # Session entries
```

## 🛠️ Troubleshooting

**Common Issues**:
- **Venue Creation 500 Error**: Run `node migrate-db.js`
- **Session Loading Error**: Fixed in latest commit
- **Database Connection**: Check SSL configuration
- **Browser Cache**: Hard refresh or clear localhost cache

See [`docs/troubleshooting.md`](docs/troubleshooting.md) for detailed solutions.

## 📖 Documentation

- **[Development Progress](docs/development-progress.md)** - Recent achievements and fixes
- **[Database Schema](docs/database-schema.md)** - Complete database reference
- **[Troubleshooting Guide](docs/troubleshooting.md)** - Common issues and solutions

## 🚀 Deployment

**Frontend**: Ready for deployment (optimized build)
**Backend**: Deployed on Railway with PostgreSQL database
**Database**: Production-ready with proper constraints and indexes

## 🔮 Roadmap

### Phase 1: Foundation ✅
- [x] Database schema and API
- [x] Basic UI with styled-components
- [x] Venue and product management
- [x] Session creation

### Phase 2: Stock-Taking Core (Next)
- [ ] Voice recognition for counting
- [ ] Photo capture for products
- [ ] Session completion workflow
- [ ] Basic reporting

### Phase 3: Advanced Features
- [ ] Invoice processing with AWS Textract
- [ ] Advanced analytics and insights
- [ ] Multi-tenant architecture
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Check [`docs/development-progress.md`](docs/development-progress.md) for current status
2. Review database schema in [`docs/database-schema.md`](docs/database-schema.md)
3. Run database migrations before making schema changes
4. Follow styled-components patterns for UI development

## 📄 License

MIT License - see LICENSE file for details

---

## 🚨 **IMMEDIATE NEXT STEPS - Version 1.6.0**

### **⚠️ URGENT: TEST VENUE AREA & QUANTITY PERSISTENCE FIX**

**Status**: Code changes deployed but **NOT YET TESTED** in browser
**Last Session**: September 29, 2025 - Schema modernization completed

**What Was Fixed (v1.6.0)**:
1. ✅ **venue_area_id** now properly saves with stock entries
2. ✅ **quantity_units** changed from INTEGER to DECIMAL(10,2) with rounding
3. ✅ **Stock counts** should now populate input fields on page reload
4. ✅ **GET entries endpoint** fixed - removed obsolete quantity_level reference

**⭐ CRITICAL TESTING REQUIRED**:
```bash
# 1. Start both servers (if not running)
cd frontend && npm start  # http://localhost:3000
cd backend && npm start   # http://localhost:3005

# 2. Test in browser:
# - Create/open a stock session
# - Enter decimal quantities (e.g., 5.67, 12.25)
# - Save entries
# - Reload the page
# - Verify quantities appear in input fields
# - Verify venue area is saved and displayed
```

**⚠️ Known Issue**: If API still returns errors, the GET entries endpoint may need additional debugging

---

## 📋 **Version 1.6.0 - Schema Modernization Complete**

**Major Changes This Version**:
- **Database Migration**: Complete stock_entries schema overhaul
- **Removed Fields**: quantity_level, condition_flags, photo_url, location_notes
- **New Schema**: quantity_units (DECIMAL), venue_area_id (foreign key)
- **API Updates**: All endpoints modernized for new schema
- **Frontend Updates**: Components updated to use quantity_units

**Database Changes**:
```sql
-- Applied migration: backend/migrate-stock-entries.js
ALTER TABLE stock_entries DROP COLUMN quantity_level, condition_flags, photo_url, location_notes;
ALTER TABLE stock_entries ADD COLUMN venue_area_id INTEGER REFERENCES venue_areas(id);
ALTER TABLE stock_entries ALTER COLUMN quantity_units TYPE DECIMAL(10,2) DEFAULT 0.00;
```

**Technical Details**:
- **Decimal Precision**: All quantities now rounded to 2 decimal places
- **Venue Association**: Stock entries properly linked to venue areas
- **API Compatibility**: Frontend and backend aligned on new schema
- **Data Integrity**: Foreign key constraints and validation added

---

**Last Updated**: September 29, 2025
**Status**: Schema Modernization Complete - **TESTING REQUIRED**
**Next**: Test quantity persistence & venue area association

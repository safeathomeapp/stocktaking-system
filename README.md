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

**Last Updated**: September 27, 2025
**Status**: Database & UI Foundation Complete
**Next**: Voice Recognition & Photo Capture

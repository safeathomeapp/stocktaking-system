# Stock Taking System v2.0.1

**Modern tablet-optimized stock-taking system for pubs and restaurants**

---

## 📖 Documentation Index

This project documentation has been organized into focused guides. Start here based on your needs:

### 🚀 Getting Started
- **[GETTING_STARTED.md](docs/GETTING_STARTED.md)** - Setup instructions, prerequisites, and first-time configuration
  - PostgreSQL installation
  - Database creation and schema
  - Running the application
  - Troubleshooting guide

### 💻 Development
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development workflow, best practices, and architecture principles
  - Local development architecture
  - Daily development workflow
  - Database management commands
  - Common pitfalls and anti-patterns
  - Working with Claude Code

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and project structure
  - Master products (single source of truth)
  - Data flow and relationships
  - Project file structure
  - Archived files documentation

### 🗄️ Database & API
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Complete database schema documentation
  - All 15 table definitions
  - Table relationships and constraints
  - Master products catalog (570+ products)
  - Key points for querying

- **[API_ENDPOINTS.md](docs/API_ENDPOINTS.md)** - REST API reference
  - All endpoints by resource type
  - Query parameters and request examples
  - Response format specifications

### 📊 Workflows & Features
- **[WORKFLOW.md](docs/WORKFLOW.md)** - Complete stock-taking and variance workflow
  - First-time venue setup
  - Invoice processing (5-step wizard)
  - Conducting stocktakes
  - Variance calculation and reporting
  - EPOS CSV import
  - Session management

- **[PARSERS.md](docs/PARSERS.md)** - Invoice PDF parsing documentation
  - Implemented parsers (Booker, Tolchards)
  - Parser architecture and design
  - Adding new supplier parsers

---

## ✅ Implemented Features (v2.0.1)

- **Venue Management** with structured addresses and contact info
- **Venue Areas** (Bar, Kitchen, Storage, etc.) with drag-and-drop ordering
- **Master Products Database** (570+ UK drinks products) with fuzzy search
- **Stock-taking Sessions** with status tracking and reopening capability
- **Smart Product Display** - Auto-converts units (ml → cl → L) and shows case sizes
- **Product Management** - Add, remove, and reorder products during stocktake
- **EPOS CSV Import** - Flexible column mapping and auto-population
- **Session History** - View and manage past stocktaking sessions
- **Responsive Tablet UI** - Professional design optimized for tablets
- **PDF Invoice Parsers** - Automatic extraction from Booker and Tolchards invoices
- **Invoice Processing** - 5-step wizard for matching and linking invoice items
- **Wastage Tracking** - Record breakages, spillages, and expired stock
- **Variance Reporting** - Calculate expected vs. actual stock

---

## 🚧 In Development / TODO

- Photo upload for products
- Advanced reporting and analytics
- Full EPOS sales analysis and variance reporting
- Additional supplier parsers

See [WORKFLOW.md](docs/WORKFLOW.md#todo-next-session) for detailed development roadmap.

---

## 📋 Quick Reference

### System Requirements
- **Node.js** 16+
- **PostgreSQL** 17
- **Operating System**: Windows (with PostgreSQL 17)

### Getting Up and Running (30 seconds)
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start

# Open browser to http://localhost:3000
```

See [GETTING_STARTED.md](docs/GETTING_STARTED.md#quick-startup-checklist) for full details.

---

## 🏗️ Architecture Overview

**Fully self-contained localhost application:**
- **PostgreSQL 17** - Local database (no cloud dependencies)
- **Node.js Backend** - REST API on port 3005
- **React Frontend** - Development server on port 3000

**Key Principles:**
- **Master Products** - Single source of truth for all product specifications
- **Venue-specific Linking** - Via venue_products linkage table
- **Clean Data Model** - No product duplication across venues
- **Invoice-to-Master** - 3-table design for invoice processing

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

---

## 🗄️ Database Overview

**15 core tables** organized by function:

| Table | Purpose |
|-------|---------|
| **venues** | Pub/restaurant locations |
| **venue_areas** | Physical zones (Bar, Kitchen, etc.) |
| **venue_products** | Products linked to specific venues |
| **master_products** | Single source of truth (570+ products) |
| **stock_sessions** | Stocktaking sessions |
| **stock_entries** | Individual product counts |
| **suppliers** | Supplier information |
| **supplier_item_list** | SKU-to-product mappings |
| **invoices** | Purchase invoices |
| **invoice_line_items** | Invoice detail lines |
| **wastage_records** | Breakages and losses |
| **user_profiles** | User accounts |

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete table definitions.

---

## 🔌 API Endpoints

**Base URL**: `http://localhost:3005`

Quick examples:
- `GET /api/venues` - List all venues
- `GET /api/master-products?search=heineken` - Search products
- `POST /api/sessions` - Create stocktaking session
- `POST /api/invoices/parse` - Parse PDF invoice
- `GET /api/health` - Check API health

See [API_ENDPOINTS.md](docs/API_ENDPOINTS.md) for full reference.

---

## 💡 Key Design Decisions

### Master Products as Single Source of Truth
All product information (brand, size, category, case_size) comes from `master_products` ONLY.
- Prevents duplication
- Ensures consistency across venues
- Simplifies updates

### Venue Products as Linkage Only
`venue_products` stores only the relationship between venues and master products.
- Maps `venue_id` → `master_product_id`
- Stores venue-specific names (e.g., EPOS system names)
- Does NOT store product specifications

### 3-Table Invoice Architecture
- **invoice_line_items** - Transaction records (pricing, quantities)
- **supplier_item_list** - Lookup table (SKU → master_product mapping)
- **master_products** - Product catalog (specifications)

This separation enables:
- Historical invoice accuracy
- Improved matching over time
- Efficient database design

See [WORKFLOW.md](docs/WORKFLOW.md#invoice-processing-architecture) for details.

---

## 🛠️ Development

### Start Development Servers
```bash
# Terminal 1 - Backend with auto-reload
cd backend && npm run dev

# Terminal 2 - Frontend with hot refresh
cd frontend && npm start
```

### Key Development Practices
- **Always use `npm run dev`** for backend (enables nodemon auto-restart)
- **Let nodemon handle restarts** - Don't kill Node processes
- **File changes auto-reload** - Just save and see changes
- **Use master_products** for all product data, never venue_products alone

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for full workflow.

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [GETTING_STARTED.md](docs/GETTING_STARTED.md) | Setup and first-time configuration |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Development workflow and practices |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and structure |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Database table definitions |
| [API_ENDPOINTS.md](docs/API_ENDPOINTS.md) | API reference |
| [WORKFLOW.md](docs/WORKFLOW.md) | Stock-taking workflow |
| [PARSERS.md](docs/PARSERS.md) | Invoice parser documentation |
| [masterproducts.md](masterproducts.md) | Complete product catalog |
| [CLEANUP_REPORT.md](CLEANUP_REPORT.md) | Code cleanup documentation |

---

## 📈 Recent Updates

### October 21, 2025
- ✅ Switched backend to `npm run dev` with nodemon auto-restart
- ✅ Imported 570 master products from UK drinks catalog
- ✅ Fixed database schema constraints

### October 20, 2025
- ✅ Complete migration from Railway to localhost PostgreSQL
- ✅ Updated README with complete documentation
- ✅ Implemented invoice processing architecture

### October 19, 2025
- ✅ Documented 3-table invoice architecture
- ✅ Implemented PDF parsing with Booker support

---

## 🤝 Contributing

When working on features:
1. **Reference [ARCHITECTURE.md](docs/ARCHITECTURE.md)** for design principles
2. **Check [DEVELOPMENT.md](docs/DEVELOPMENT.md)** for best practices
3. **Review [WORKFLOW.md](docs/WORKFLOW.md)** for business logic
4. **Use [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** for data structure
5. **Check [API_ENDPOINTS.md](docs/API_ENDPOINTS.md)** for endpoint details

---

## 📞 Support

- **Setup Issues?** See [GETTING_STARTED.md](docs/GETTING_STARTED.md#troubleshooting)
- **Architecture Questions?** Check [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Database Questions?** Review [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- **Workflow Questions?** See [WORKFLOW.md](docs/WORKFLOW.md)
- **Development Help?** Check [DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## 📄 Version Info

- **Current Version**: v2.0.1
- **Release Date**: October 2025
- **Status**: Working Prototype
- **Database**: PostgreSQL 17 (local)
- **Backend**: Node.js + Express
- **Frontend**: React + Styled Components

---

## 📋 Session Notes

For detailed session summaries and development history, see the session documentation files in the docs folder.

# Troubleshooting Guide

## 🛠️ Common Issues & Solutions

This guide covers common issues encountered during development and their solutions.

---

## 🔴 Database Issues

### Issue: Venue Creation 500 Error
```
POST /api/venues → 500 Internal Server Error
```

**Symptoms**:
- Venue creation form submission fails
- Console shows 500 error from venues endpoint
- No venue appears in database

**Root Cause**: Database schema mismatch

**Solution**:
1. **Run database migration**:
   ```bash
   cd backend
   node migrate-db.js
   ```

2. **Verify schema is updated**:
   ```bash
   node check-db.js
   ```

3. **Test venue creation**:
   ```bash
   curl -X POST "https://stocktaking-api-production.up.railway.app/api/venues" \
   -H "Content-Type: application/json" \
   -d '{"name": "Test Venue", "address_line_1": "123 Test St", "city": "Test City"}'
   ```

**Prevention**: Always run migrations when updating database schema

---

### Issue: Database Connection Failed
```
Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

**Symptoms**:
- Cannot connect to Railway database
- All API endpoints return connection errors
- Database scripts fail to run

**Root Cause**: Incorrect SSL configuration for Railway PostgreSQL

**Solution**:
1. **Update database connection** (if using custom scripts):
   ```javascript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
       rejectUnauthorized: false  // Required for Railway
     }
   });
   ```

2. **Verify environment variables**:
   ```bash
   echo $DATABASE_URL
   # Should show: postgresql://postgres:password@host:port/database
   ```

3. **Test connection**:
   ```bash
   node backend/check-db.js
   ```

---

### Issue: Product Unit Type Constraint Error
```
error: new row for relation "products" violates check constraint "products_unit_type_check"
```

**Symptoms**:
- Cannot insert products into database
- Product creation fails with constraint violation
- Error mentions unit_type check constraint

**Root Cause**: Invalid unit_type value used

**Valid unit_type values**:
- `'bottle'` ✅
- `'can'` ✅
- `'keg'` ✅
- `'case'` ✅
- `'jar'` ✅
- `'packet'` ✅
- `'other'` ✅

**Invalid values**:
- `'bottles'` ❌ (plural)
- `'cans'` ❌ (plural)
- `'bottle_'` ❌ (typo)

**Solution**:
1. **Check constraint values**:
   ```bash
   node backend/check-constraints.js
   ```

2. **Update product data**:
   ```javascript
   // Correct usage
   unit_type: 'bottle'  // singular form

   // Incorrect usage
   unit_type: 'bottles' // plural form - will fail
   ```

---

## 🔴 Frontend Issues

### Issue: Session Data Loading Error
```javascript
TypeError: entriesResponse.data.forEach is not a function
```

**Symptoms**:
- Stock-taking page fails to load
- Console shows forEach error
- Session data doesn't display

**Root Cause**: API response structure mismatch

**API Returns**: `{entries: [...], summary: {...}}`
**Frontend Expected**: `[...]` (direct array)

**Solution**:
Fixed in `frontend/src/components/StockTaking.js`:
```javascript
// Before (incorrect)
entriesResponse.data.forEach(entry => {

// After (correct)
const entries = entriesResponse.data.entries || [];
entries.forEach(entry => {
```

**Status**: ✅ Fixed in latest commit

---

### Issue: Navigation Styling Inconsistent
**Symptoms**:
- Navigation looks different from other components
- Inline styles mixed with styled-components
- Not responsive on mobile

**Solution**: ✅ Fixed - Navigation converted to styled-components

---

### Issue: Browser Cache Shows Old Errors
**Symptoms**:
- Browser console still shows 500 errors after fixes
- Old error messages persist
- Changes don't appear to work

**Solution**:
1. **Hard refresh browser**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear browser cache** for localhost
3. **Restart dev server**:
   ```bash
   cd frontend
   npm start
   ```

---

## 🔴 API Issues

### Issue: Venue Products Return Empty Array
**Symptoms**:
- API returns `[]` for venue products
- Products exist in database but not returned
- Stock-taking page shows no products

**Root Cause**: No products associated with venue

**Solution**:
1. **Add sample products**:
   ```bash
   cd backend
   node fix-products.js
   ```

2. **Verify products exist**:
   ```bash
   curl -s "https://stocktaking-api-production.up.railway.app/api/venues/VENUE_ID/products"
   ```

3. **Check product-venue relationship**:
   ```sql
   SELECT v.name, COUNT(p.id) as product_count
   FROM venues v
   LEFT JOIN products p ON v.id = p.venue_id
   GROUP BY v.id, v.name;
   ```

---

### Issue: Session Creation Fails
**Symptoms**:
- Cannot create new stock-taking sessions
- Session endpoint returns errors
- Missing required fields error

**Solution**:
1. **Check required fields**:
   ```javascript
   {
     "venue_id": "uuid",        // Required
     "stocktaker_name": "name", // Required
     "notes": "optional"        // Optional
   }
   ```

2. **Verify venue exists**:
   ```bash
   curl -s "https://stocktaking-api-production.up.railway.app/api/venues"
   ```

3. **Test session creation**:
   ```bash
   curl -X POST "https://stocktaking-api-production.up.railway.app/api/sessions" \
   -H "Content-Type: application/json" \
   -d '{"venue_id": "VENUE_ID", "stocktaker_name": "Test User"}'
   ```

---

## 🔴 Development Environment Issues

### Issue: Railway CLI Not Linked
```
No linked project found. Run railway link to connect to a project
```

**Solution**:
1. **Login to Railway**:
   ```bash
   railway login
   ```

2. **Link project**:
   ```bash
   railway link
   # Select: stocktaking-api
   ```

3. **Verify connection**:
   ```bash
   railway status
   ```

---

### Issue: NPM Build Warnings
```
[eslint] React Hook useEffect has a missing dependency
```

**Status**: ⚠️ Warnings acknowledged
- **Impact**: No functional impact
- **Cause**: Missing dependencies in useEffect hooks
- **Action**: Safe to ignore for now, will be addressed in code cleanup phase

---

## 🔴 Styling Issues

### Issue: Theme Properties Not Available
```javascript
TypeError: Cannot read property 'colors' of undefined
```

**Symptoms**:
- Styled-components fail to render
- Theme properties undefined
- Components show unstyled

**Solution**:
1. **Ensure ThemeProvider wraps app**:
   ```javascript
   import { ThemeProvider } from 'styled-components';
   import { theme } from './styles/theme';

   <ThemeProvider theme={theme}>
     <App />
   </ThemeProvider>
   ```

2. **Verify theme import**:
   ```javascript
   // Correct import
   import { theme } from '../styles/theme';

   // Theme usage in styled-component
   color: ${props => props.theme.colors.primary};
   ```

---

## 🔧 Quick Diagnostic Commands

### Database Health Check
```bash
cd backend
node check-db.js
```

### API Health Check
```bash
curl -s "https://stocktaking-api-production.up.railway.app/api/health"
```

### Frontend Build Check
```bash
cd frontend
npm run build
```

### Verify All Test Data
```bash
cd backend
node fix-products.js  # Adds products
curl -s "https://stocktaking-api-production.up.railway.app/api/venues" | jq '.[0].name'
```

---

## 🔄 Complete Reset Procedure

If multiple issues occur, follow this reset procedure:

### 1. Database Reset
```bash
cd backend
node migrate-db.js    # Update schema
node fix-products.js  # Add test data
node check-db.js      # Verify structure
```

### 2. Frontend Reset
```bash
cd frontend
rm -rf node_modules package-lock.json  # Clear dependencies
npm install                            # Reinstall
npm run build                          # Test build
npm start                              # Start dev server
```

### 3. API Verification
```bash
# Test all major endpoints
curl -s "https://stocktaking-api-production.up.railway.app/api/health"
curl -s "https://stocktaking-api-production.up.railway.app/api/venues"
curl -X POST "https://stocktaking-api-production.up.railway.app/api/sessions" \
-H "Content-Type: application/json" \
-d '{"venue_id": "VENUE_ID", "stocktaker_name": "Test"}'
```

---

## 🆘 Emergency Contacts & Resources

### Documentation
- **Database Schema**: `docs/database-schema.md`
- **Development Progress**: `docs/development-progress.md`
- **API Endpoints**: Backend `server.js` file

### External Services
- **Railway Dashboard**: https://railway.app/dashboard
- **GitHub Repository**: https://github.com/safeathomeapp/stocktaking-system

### Useful Commands
```bash
# Check Railway service status
railway status

# View Railway logs
railway logs

# Deploy to Railway
railway up

# Connect to Railway database
railway connect postgresql
```

---

*Last Updated: September 27, 2025*
*Issues Tracked: All major development issues documented*
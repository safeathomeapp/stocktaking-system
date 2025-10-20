# Project Cleanup Report - Unused Files

Generated: 2025-10-20

## Summary
Found **8 unused files** that can be safely deleted or archived.

---

## Files to Delete

### 1. Duplicate Pages (Old Architecture)
These were from an older structure before migrating to `components/`:

- **frontend/src/pages/Dashboard.js** ❌ UNUSED
  - **Used instead:** `frontend/src/components/Dashboard.js`
  - **Imported by:** App.js (line 7)

- **frontend/src/pages/SessionHistory.js** ❌ UNUSED
  - **Used instead:** `frontend/src/components/SessionHistory.js`
  - **Imported by:** App.js (line 9)

- **frontend/src/pages/StockTaking.js** ❌ UNUSED
  - **Used instead:** `frontend/src/components/StockTaking.js`
  - **Imported by:** App.js (line 8)

- **frontend/src/pages/VenueSelection.js** ❌ UNUSED
  - **No imports found** - appears to be deprecated entirely

---

### 2. Unused Service Files

- **frontend/src/services/api.js** ❌ UNUSED
  - **Used instead:** `frontend/src/services/apiService.js`
  - **Usage:** apiService is imported 17 times across the codebase
  - **Note:** api.js has 0 imports

---

### 3. Unused Styled Components

- **frontend/src/styles/components/Card.js** ❌ UNUSED
  - No imports found in codebase

- **frontend/src/styles/components/Form.js** ❌ UNUSED
  - No imports found in codebase

- **frontend/src/styles/components/Layout.js** ❌ UNUSED
  - No imports found in codebase

**Note:** Only `Button.js` from styles/components is actually used

---

### 4. Unused Components

- **frontend/src/components/Navigation.js** ❌ UNUSED
  - No imports found in codebase

---

## How to Identify Unused Files (Method Used)

### 1. List All Files
```bash
find frontend/src -type f -name "*.js" -o -name "*.jsx" | sort
```

### 2. Search for Imports
```bash
# For each suspicious file, check if it's imported:
grep -r "from.*<filename>" frontend/src --include="*.js"
```

### 3. Trace from Entry Point
- Start with `App.js` (main entry point)
- Check `index.js` (React entry)
- Follow the import chain

### 4. Count Usage
```bash
# Count how many times a file is imported:
grep -r "from.*apiService" frontend/src --include="*.js" | wc -l
```

---

## Recommended Actions

### Option 1: Archive (Safer)
Create an archive folder before deleting:

```bash
mkdir -p frontend/src/_archived/pages
mkdir -p frontend/src/_archived/services
mkdir -p frontend/src/_archived/styles/components
mkdir -p frontend/src/_archived/components

# Move files to archive
mv frontend/src/pages/Dashboard.js frontend/src/_archived/pages/
mv frontend/src/pages/SessionHistory.js frontend/src/_archived/pages/
mv frontend/src/pages/StockTaking.js frontend/src/_archived/pages/
mv frontend/src/pages/VenueSelection.js frontend/src/_archived/pages/
mv frontend/src/services/api.js frontend/src/_archived/services/
mv frontend/src/styles/components/Card.js frontend/src/_archived/styles/components/
mv frontend/src/styles/components/Form.js frontend/src/_archived/styles/components/
mv frontend/src/styles/components/Layout.js frontend/src/_archived/styles/components/
mv frontend/src/components/Navigation.js frontend/src/_archived/components/
```

### Option 2: Delete Permanently (Only if confident)
```bash
# Delete unused files (USE WITH CAUTION)
rm frontend/src/pages/Dashboard.js
rm frontend/src/pages/SessionHistory.js
rm frontend/src/pages/StockTaking.js
rm frontend/src/pages/VenueSelection.js
rm frontend/src/services/api.js
rm frontend/src/styles/components/Card.js
rm frontend/src/styles/components/Form.js
rm frontend/src/styles/components/Layout.js
rm frontend/src/components/Navigation.js
```

### Option 3: Git-Based Approach (Best Practice)
Since you have git history, you can safely delete files:

```bash
# Make a branch for cleanup
git checkout -b cleanup/remove-unused-files

# Delete files
rm frontend/src/pages/Dashboard.js
rm frontend/src/pages/SessionHistory.js
rm frontend/src/pages/StockTaking.js
rm frontend/src/pages/VenueSelection.js
rm frontend/src/services/api.js
rm frontend/src/styles/components/Card.js
rm frontend/src/styles/components/Form.js
rm frontend/src/styles/components/Layout.js
rm frontend/src/components/Navigation.js

# Commit
git add -A
git commit -m "chore: Remove 8 unused files from old architecture

Removed duplicate pages (migrated to components/):
- pages/Dashboard.js
- pages/SessionHistory.js
- pages/StockTaking.js
- pages/VenueSelection.js

Removed unused service:
- services/api.js (replaced by apiService.js)

Removed unused styled components:
- styles/components/Card.js
- styles/components/Form.js
- styles/components/Layout.js

Removed unused component:
- components/Navigation.js

All files verified as having zero imports in codebase."

# Test the app still works
npm start

# If everything works, merge back:
git checkout main
git merge cleanup/remove-unused-files
```

---

## Files That ARE Used (Keep These)

✅ **All components imported in App.js:**
- components/Dashboard.js
- components/StockTaking.js
- components/SessionHistory.js
- components/Analysis.js
- components/VenueManagement.js
- components/Settings.js
- components/InvoiceInput.js
- components/InvoiceImport.js
- components/ManualInvoiceEntry.js
- components/SupplierInvoiceReview.js
- components/EposCsvInput.js
- components/AreaSetup.js

✅ **Sub-components:**
- components/InvoiceImportSummary.js (imported by SupplierInvoiceReview.js)
- components/MasterProductMatcher.js (imported by SupplierInvoiceReview.js)

✅ **Services:**
- services/apiService.js (imported 17 times)
- config/api.js (used by apiService.js)

✅ **Utilities:**
- utils/helpers.js (imported by Dashboard, SessionHistory, etc.)

✅ **Styled Components:**
- styles/components/Button.js (widely used)
- styles/GlobalStyles.js (imported in App.js)
- styles/theme/index.js (imported in App.js)

---

## Testing After Cleanup

After removing files, verify:

1. **Build succeeds:**
   ```bash
   cd frontend && npm run build
   ```

2. **No console errors:**
   - Check browser console
   - Check terminal for webpack errors

3. **All routes work:**
   - Navigate through all pages in the UI
   - Check no 404s or import errors

4. **Run any tests:**
   ```bash
   npm test
   ```

---

## Disk Space Saved

Approximate space saved by removing these 8 files: **~100-200 KB**

(Not significant for disk space, but reduces codebase complexity and confusion)

---

## Prevention Strategy

To avoid accumulating unused files in the future:

1. **Before creating new files**, check if similar ones exist
2. **When refactoring**, delete old files immediately
3. **Periodically run import checks** (every month or sprint)
4. **Use ESLint** with unused exports detection
5. **Document architecture** in README to prevent confusion

---

Generated by Claude Code analysis

#!/bin/bash

# Archive Unused Files Script
# This script moves unused files to _archived/ directory for safekeeping
# Generated: 2025-10-20

echo "🗂️  Archiving Unused Files"
echo "================================"
echo ""

# Create archive directory structure
echo "Creating archive directories..."
mkdir -p frontend/src/_archived/pages
mkdir -p frontend/src/_archived/services
mkdir -p frontend/src/_archived/styles/components
mkdir -p frontend/src/_archived/components

# Create a log file
LOG_FILE="archive-log-$(date +%Y%m%d-%H%M%S).txt"
echo "Archive Log - $(date)" > "$LOG_FILE"
echo "================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Counter for files moved
FILES_MOVED=0

# Function to archive a file
archive_file() {
    local source=$1
    local dest=$2

    if [ -f "$source" ]; then
        echo "  ✓ Moving: $source → $dest"
        mv "$source" "$dest"
        echo "MOVED: $source → $dest" >> "$LOG_FILE"
        ((FILES_MOVED++))
    else
        echo "  ⚠ File not found: $source (skipping)"
        echo "NOT FOUND: $source" >> "$LOG_FILE"
    fi
}

echo ""
echo "Archiving duplicate pages..."
archive_file "frontend/src/pages/Dashboard.js" "frontend/src/_archived/pages/Dashboard.js"
archive_file "frontend/src/pages/SessionHistory.js" "frontend/src/_archived/pages/SessionHistory.js"
archive_file "frontend/src/pages/StockTaking.js" "frontend/src/_archived/pages/StockTaking.js"
archive_file "frontend/src/pages/VenueSelection.js" "frontend/src/_archived/pages/VenueSelection.js"

echo ""
echo "Archiving unused services..."
archive_file "frontend/src/services/api.js" "frontend/src/_archived/services/api.js"

echo ""
echo "Archiving unused styled components..."
archive_file "frontend/src/styles/components/Card.js" "frontend/src/_archived/styles/components/Card.js"
archive_file "frontend/src/styles/components/Form.js" "frontend/src/_archived/styles/components/Form.js"
archive_file "frontend/src/styles/components/Layout.js" "frontend/src/_archived/styles/components/Layout.js"

echo ""
echo "Archiving unused components..."
archive_file "frontend/src/components/Navigation.js" "frontend/src/_archived/components/Navigation.js"

echo ""
echo "================================"
echo "✅ Archive Complete!"
echo ""
echo "Files moved: $FILES_MOVED"
echo "Log file: $LOG_FILE"
echo ""
echo "The archived files are in: frontend/src/_archived/"
echo ""
echo "Next steps:"
echo "  1. Test the application: npm start"
echo "  2. If everything works, commit the changes"
echo "  3. If something breaks, run the restore script"
echo ""
echo "To restore archived files, run: ./restore-archived-files.sh"

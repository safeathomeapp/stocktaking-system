#!/bin/bash

# Restore Archived Files Script
# This script restores files from _archived/ back to their original locations
# Generated: 2025-10-20

echo "🔄 Restoring Archived Files"
echo "================================"
echo ""

# Counter for files restored
FILES_RESTORED=0

# Function to restore a file
restore_file() {
    local source=$1
    local dest=$2

    if [ -f "$source" ]; then
        echo "  ✓ Restoring: $source → $dest"

        # Check if destination already exists
        if [ -f "$dest" ]; then
            echo "    ⚠ Warning: $dest already exists. Creating backup..."
            mv "$dest" "$dest.backup-$(date +%Y%m%d-%H%M%S)"
        fi

        mv "$source" "$dest"
        ((FILES_RESTORED++))
    else
        echo "  ⚠ Archive not found: $source (skipping)"
    fi
}

echo "Restoring pages..."
restore_file "frontend/src/_archived/pages/Dashboard.js" "frontend/src/pages/Dashboard.js"
restore_file "frontend/src/_archived/pages/SessionHistory.js" "frontend/src/pages/SessionHistory.js"
restore_file "frontend/src/_archived/pages/StockTaking.js" "frontend/src/pages/StockTaking.js"
restore_file "frontend/src/_archived/pages/VenueSelection.js" "frontend/src/pages/VenueSelection.js"

echo ""
echo "Restoring services..."
restore_file "frontend/src/_archived/services/api.js" "frontend/src/services/api.js"

echo ""
echo "Restoring styled components..."
restore_file "frontend/src/_archived/styles/components/Card.js" "frontend/src/styles/components/Card.js"
restore_file "frontend/src/_archived/styles/components/Form.js" "frontend/src/styles/components/Form.js"
restore_file "frontend/src/_archived/styles/components/Layout.js" "frontend/src/styles/components/Layout.js"

echo ""
echo "Restoring components..."
restore_file "frontend/src/_archived/components/Navigation.js" "frontend/src/components/Navigation.js"

echo ""
echo "================================"
echo "✅ Restore Complete!"
echo ""
echo "Files restored: $FILES_RESTORED"
echo ""
echo "The files have been moved back to their original locations."
echo "The _archived directory still exists but is now empty."
echo ""

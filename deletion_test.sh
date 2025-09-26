#!/bin/bash

# Individual test for stock entry deletion functionality

API_BASE="https://stocktaking-api-production.up.railway.app"
VENUE_ID="8af7ee32-807b-449e-a28b-5cae546b6f95"
PRODUCT_ID="6b1e1ec1-4722-4c79-8fde-e58456bcefbf"

echo "=========================================="
echo "Stock Entry Deletion - Individual Test"
echo "=========================================="
echo ""

# Step 1: Create a new session for deletion test
echo "Step 1: Creating new session for deletion test..."
response=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"venue_id":"'$VENUE_ID'","stocktaker_name":"Deletion Test User","notes":"Session specifically for testing deletion"}' \
  "$API_BASE/api/sessions")

SESSION_ID=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
    echo "Failed to create session"
    echo "Response: $response"
    exit 1
fi

echo "Created session: $SESSION_ID"
echo ""

# Step 2: Add a stock entry to delete
echo "Step 2: Creating stock entry to delete..."
response=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"product_id":"'$PRODUCT_ID'","quantity_level":0.6,"quantity_units":4,"location_notes":"Test entry for deletion"}' \
  "$API_BASE/api/sessions/$SESSION_ID/entries")

ENTRY_ID=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ENTRY_ID" ]; then
    echo "Failed to create stock entry"
    echo "Response: $response"
    exit 1
fi

echo "Created entry: $ENTRY_ID"
echo ""

# Step 3: Delete the entry
echo "Step 3: Deleting the stock entry..."
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X DELETE "$API_BASE/api/entries/$ENTRY_ID")

# Extract HTTP status code and response body
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
response_body=$(echo $response | sed -e 's/HTTPSTATUS:.*//')

echo "HTTP Status: $http_code"
echo "Response: $response_body"
echo ""

# Summary
echo "=========================================="
echo "TEST RESULTS:"
echo "=========================================="

if [ "$http_code" -eq 200 ]; then
    echo "DELETION TEST PASSED"
    echo "Successfully deleted entry (HTTP 200)"
else
    echo "DELETION TEST FAILED"
    echo "Delete returned HTTP $http_code (expected 200)"
fi

echo ""
echo "Test completed"
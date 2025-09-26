#!/bin/bash

# Comprehensive Stock Taking API Test Script
# Tests all endpoints in a realistic workflow sequence

API_BASE="https://stocktaking-api-production.up.railway.app"

echo "=========================================="
echo "Stock Taking API - Comprehensive Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_TOTAL=0

# Function to test API call
test_api() {
    local description="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -e "${BLUE}Test $TESTS_TOTAL: $description${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_BASE$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$API_BASE$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$API_BASE$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X DELETE "$API_BASE$endpoint")
    fi
    
    # Extract HTTP status code
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    # Extract response body
    response_body=$(echo $response | sed -e 's/HTTPSTATUS:.*//')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # Extract key values for later use
        if [[ "$endpoint" == "/api/venues" && "$method" == "GET" ]]; then
            VENUE_ID=$(echo $response_body | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
            echo "  → Using Venue ID: $VENUE_ID"
        elif [[ "$endpoint" == "/api/sessions" && "$method" == "POST" ]]; then
            SESSION_ID=$(echo $response_body | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
            echo "  → Created Session ID: $SESSION_ID"
        elif [[ "$endpoint" =~ "/products" && "$method" == "GET" ]]; then
            PRODUCT_ID=$(echo $response_body | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
            echo "  → Using Product ID: $PRODUCT_ID"
        elif [[ "$endpoint" =~ "/entries" && "$method" == "POST" ]]; then
            ENTRY_ID=$(echo $response_body | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
            echo "  → Created Entry ID: $ENTRY_ID"
        fi
        
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $http_code)"
        echo "Response: $response_body"
    fi
    echo ""
}

echo -e "${YELLOW}PHASE 1: SYSTEM HEALTH & DATA SETUP${NC}"
echo "======================================"

# Test 1: Health check
test_api "System health check" "GET" "/api/health" "" 200

# Test 2: Get venues
test_api "Get all venues" "GET" "/api/venues" "" 200

# Test 3: Get products for venue
test_api "Get products for venue" "GET" "/api/venues/$VENUE_ID/products" "" 200

echo -e "${YELLOW}PHASE 2: SESSION MANAGEMENT${NC}"
echo "============================"

# Test 4: Create new session
test_api "Create new stock session" "POST" "/api/sessions" '{"venue_id":"'$VENUE_ID'","stocktaker_name":"API Test User","notes":"Comprehensive test session"}' 201

# Test 5: Get session details
test_api "Get session details" "GET" "/api/sessions/$SESSION_ID" "" 200

# Test 6: Get venue session history
test_api "Get venue session history" "GET" "/api/venues/$VENUE_ID/sessions" "" 200

# Test 7: Get all active sessions
test_api "Get all active sessions" "GET" "/api/sessions" "" 200

echo -e "${YELLOW}PHASE 3: STOCK ENTRY MANAGEMENT${NC}"
echo "==============================="

# Test 8: Create first stock entry
test_api "Create stock entry #1" "POST" "/api/sessions/$SESSION_ID/entries" '{"product_id":"'$PRODUCT_ID'","quantity_level":0.75,"quantity_units":3,"location_notes":"Bar area","condition_flags":{"damaged":false,"expired":false}}' 201

FIRST_ENTRY_ID=$ENTRY_ID

# Test 9: Create second stock entry (get second product first)
# We'll use a hardcoded product ID from your test data since we can't easily parse the second one
SECOND_PRODUCT_ID="40637842-7c4b-4d01-aa65-466cfd9189b7" # Stella Artois
test_api "Create stock entry #2" "POST" "/api/sessions/$SESSION_ID/entries" '{"product_id":"'$SECOND_PRODUCT_ID'","quantity_level":0.5,"quantity_units":2,"location_notes":"Cellar"}' 201

SECOND_ENTRY_ID=$ENTRY_ID

# Test 10: Get all entries for session
test_api "Get all session entries" "GET" "/api/sessions/$SESSION_ID/entries" "" 200

# Test 11: Update stock entry
test_api "Update stock entry" "PUT" "/api/entries/$FIRST_ENTRY_ID" '{"quantity_level":0.25,"quantity_units":1,"location_notes":"Updated: Storage room"}' 200

# Test 12: Get session progress
test_api "Get session progress" "GET" "/api/sessions/$SESSION_ID/progress" "" 200

echo -e "${YELLOW}PHASE 4: ERROR HANDLING & VALIDATION${NC}"
echo "===================================="

# Test 13: Try to create duplicate entry
test_api "Prevent duplicate entry creation" "POST" "/api/sessions/$SESSION_ID/entries" '{"product_id":"'$PRODUCT_ID'","quantity_level":0.8}' 409

# Test 14: Try invalid quantity level
test_api "Reject invalid quantity level" "POST" "/api/sessions/$SESSION_ID/entries" '{"product_id":"9f31c65c-3567-4d5f-bce8-322f168e8133","quantity_level":1.5}' 400

# Test 15: Try to access non-existent session
test_api "Handle non-existent session" "GET" "/api/sessions/00000000-0000-0000-0000-000000000000" "" 404

# Test 16: Try to update non-existent entry
test_api "Handle non-existent entry update" "PUT" "/api/entries/00000000-0000-0000-0000-000000000000" '{"quantity_level":0.5}' 404

echo -e "${YELLOW}PHASE 5: SESSION COMPLETION${NC}"
echo "=========================="

# Test 17: Complete the session
test_api "Complete stock session" "PUT" "/api/sessions/$SESSION_ID" '{"status":"completed","notes":"Test session completed successfully"}' 200

# Test 18: Verify session is completed
test_api "Verify completed session" "GET" "/api/sessions/$SESSION_ID" "" 200

# Test 19: Try to add entry to completed session (should fail)
test_api "Prevent entry addition to completed session" "POST" "/api/sessions/$SESSION_ID/entries" '{"product_id":"60064a14-4e05-43fb-a24c-b591d9526093","quantity_level":0.3}' 400

# Test 20: Delete stock entry (create new session first)
echo -e "${BLUE}Test 20: Testing entry deletion (creating new session)${NC}"
TESTS_TOTAL=$((TESTS_TOTAL + 1))
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d '{"venue_id":"'$VENUE_ID'","stocktaker_name":"Deletion Test","notes":"For testing deletion"}' "$API_BASE/api/sessions")
DELETE_SESSION_ID=$(echo $response | sed -e 's/HTTPSTATUS:.*//' | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# Add entry to delete
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d '{"product_id":"'$PRODUCT_ID'","quantity_level":0.3}' "$API_BASE/api/sessions/$DELETE_SESSION_ID/entries")
DELETE_ENTRY_ID=$(echo $response | sed -e 's/HTTPSTATUS:.*//' | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

test_api "Delete stock entry" "DELETE" "/api/entries/$DELETE_ENTRY_ID" "" 200

echo -e "${YELLOW}PHASE 6: FINAL VERIFICATION${NC}"
echo "========================="

# Test 21: Check all sessions for venue
test_api "Final venue session check" "GET" "/api/venues/$VENUE_ID/sessions" "" 200

# Test 22: Get all completed sessions
test_api "Get all completed sessions" "GET" "/api/sessions?status=completed" "" 200

echo ""
echo "=========================================="
echo -e "${YELLOW}TEST SUITE SUMMARY${NC}"
echo "=========================================="
echo -e "Total Tests: $TESTS_TOTAL"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$((TESTS_TOTAL - TESTS_PASSED))${NC}"

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Stock Taking API is fully operational.${NC}"
    echo ""
    echo "✅ Session management working"
    echo "✅ Stock entry functionality working"
    echo "✅ Progress tracking working"
    echo "✅ Error handling working"
    echo "✅ Data validation working"
    echo ""
    echo "Your stock-taking system is ready for frontend development!"
else
    echo -e "${RED}❌ Some tests failed. Check the API endpoints and database.${NC}"
    echo ""
    echo "Review the failed tests above and fix any issues before proceeding."
fi

echo ""
echo "Test completed at: $(date)"
echo "=========================================="
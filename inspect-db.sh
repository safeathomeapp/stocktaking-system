#!/bin/bash

# Database connection settings
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="stocktaking_local"
DB_USER="postgres"
PSQL="C:/Program Files/PostgreSQL/17/bin/psql.exe"

# Color codes for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          🗄️  DATABASE INSPECTOR - Stock Taking System                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"

# Get all tables
echo -e "\n${YELLOW}Fetching available tables...${NC}\n"

TABLES=$("$PSQL" -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -t -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
" 2>&1 | grep -v '^$')

if [[ -z "$TABLES" ]]; then
  echo -e "${RED}❌ Error: Cannot connect to database. Is PostgreSQL running?${NC}\n"
  exit 1
fi

# Display table list
echo -e "${GREEN}📚 AVAILABLE TABLES:${NC}\n"

TABLE_ARRAY=($TABLES)
for i in "${!TABLE_ARRAY[@]}"; do
  printf "  %2d. %s\n" $((i+1)) "${TABLE_ARRAY[$i]}"
done

# Loop for continuous inspection
while true; do
  echo ""
  read -p "$(echo -e ${YELLOW}🔍 Enter table number or press 'q' to quit: ${NC})" choice

  if [[ "$choice" == "q" || "$choice" == "Q" ]]; then
    echo -e "\n${GREEN}👋 Goodbye!${NC}\n"
    exit 0
  fi

  # Validate input
  if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt ${#TABLE_ARRAY[@]} ]; then
    echo -e "${RED}❌ Invalid selection. Please try again.${NC}"
    continue
  fi

  # Get selected table (array is 0-indexed, but user selection is 1-indexed)
  SELECTED_TABLE="${TABLE_ARRAY[$((choice-1))]}"

  clear

  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}📊 TABLE: ${GREEN}${SELECTED_TABLE^^}${BLUE}${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"

  # Display columns
  echo -e "\n${GREEN}📋 COLUMNS:${NC}"
  echo -e "${BLUE}───────────────────────────────────────────────────────────────────────────${NC}"
  "$PSQL" -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -c "
  SELECT
    '  • ' || column_name as 'Column' ,
    data_type as 'Type',
    CASE WHEN is_nullable = 'YES' THEN '(nullable)' ELSE '(NOT NULL)' END as 'Constraint'
  FROM information_schema.columns
  WHERE table_name = '$SELECTED_TABLE'
  ORDER BY ordinal_position;
  "

  # Display record count
  echo -e "\n${GREEN}📈 RECORD COUNT:${NC}"
  echo -e "${BLUE}───────────────────────────────────────────────────────────────────────────${NC}"
  COUNT=$("$PSQL" -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -t -c "SELECT COUNT(*) FROM $SELECTED_TABLE;")
  echo -e "  Total records: ${YELLOW}$COUNT${NC}"

  # Display first 10 records
  RECORD_COUNT=$(echo $COUNT | tr -d ' ')
  if [ "$RECORD_COUNT" -gt 0 ]; then
    echo -e "\n${GREEN}📄 FIRST 10 RECORDS:${NC}"
    echo -e "${BLUE}───────────────────────────────────────────────────────────────────────────${NC}"
    "$PSQL" -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -c "SELECT * FROM $SELECTED_TABLE LIMIT 10;"
  else
    echo -e "\n${YELLOW}⚠️  No data in this table${NC}"
  fi

  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}\n"
  read -p "Press Enter to continue..."
done

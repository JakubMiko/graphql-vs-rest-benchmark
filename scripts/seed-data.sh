#!/bin/bash
set -e

echo "============================================"
echo "Database Seeding Script for Benchmark"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Resetting databases...${NC}"
echo -e "${YELLOW}  (Disabling production check for benchmark environment)${NC}"
docker-compose exec -e DISABLE_DATABASE_ENVIRONMENT_CHECK=1 eventql-graphql bin/rails db:reset
docker-compose exec -e DISABLE_DATABASE_ENVIRONMENT_CHECK=1 eventql-rest bin/rails db:reset
echo -e "${GREEN}✓ Databases reset complete${NC}"
echo ""

echo -e "${BLUE}Step 2: Running migrations...${NC}"
docker-compose exec eventql-graphql bin/rails db:migrate
docker-compose exec eventql-rest bin/rails db:migrate
echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

echo -e "${BLUE}Step 3: Seeding GraphQL database...${NC}"
docker-compose exec eventql-graphql bin/rails db:seed
echo -e "${GREEN}✓ GraphQL seeding complete${NC}"
echo ""

echo -e "${BLUE}Step 4: Seeding REST database...${NC}"
docker-compose exec eventql-rest bin/rails db:seed
echo -e "${GREEN}✓ REST seeding complete${NC}"
echo ""

echo -e "${BLUE}Step 5: Verifying data counts...${NC}"
echo ""

echo -e "${YELLOW}GraphQL Database:${NC}"
docker-compose exec eventql-graphql bin/rails runner "
  puts '  Events: ' + Event.count.to_s
  puts '  Users: ' + User.count.to_s
  puts '  TicketBatches: ' + TicketBatch.count.to_s
  puts '  Orders: ' + Order.count.to_s
  puts '  Tickets: ' + Ticket.count.to_s
"

echo ""
echo -e "${YELLOW}REST Database:${NC}"
docker-compose exec eventql-rest bin/rails runner "
  puts '  Events: ' + Event.count.to_s
  puts '  Users: ' + User.count.to_s
  puts '  TicketBatches: ' + TicketBatch.count.to_s
  puts '  Orders: ' + Order.count.to_s
  puts '  Tickets: ' + Ticket.count.to_s
"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✓ Database seeding complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Verify that both databases have IDENTICAL counts!${NC}"
echo -e "${YELLOW}  If counts differ, update seed files to use same data.${NC}"

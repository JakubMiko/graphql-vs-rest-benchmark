#!/bin/bash
# Cleanup test data created during write operations tests
# This script deletes all test events created by the benchmark tests
# Run this after write operations tests to keep the database clean

set -e

echo "============================================"
echo "Cleaning up test data"
echo "============================================"

echo ""
echo "Cleaning up EventQL (GraphQL API)..."
echo "Deleting test events..."

# Delete test events from EventQL database
docker-compose exec -T eventql /rails/bin/rails runner "
  events = Event.where('name LIKE ?', 'Test Event %')
  count = events.count
  events.destroy_all
  puts \"Deleted #{count} test events from EventQL\"
"

echo ""
echo "Cleaning up EventREST (REST API)..."
echo "Deleting test events..."

# Delete test events from EventREST database
docker-compose exec -T event-rest /rails/bin/rails runner "
  events = Event.where('name LIKE ?', 'Test Event %')
  count = events.count
  events.destroy_all
  puts \"Deleted #{count} test events from EventREST\"
"

echo ""
echo "============================================"
echo "Cleanup completed!"
echo "============================================"

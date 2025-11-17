#!/bin/bash
# Cleanup test data created during benchmark tests
# This script deletes test events and orders created by the test user
# Run this after write operations or concurrent users tests

set -e

TEST_USER_EMAIL="test@benchmark.com"

echo "============================================"
echo "Cleaning up test data"
echo "============================================"

echo ""
echo "Cleaning up EventQL (GraphQL API)..."

# Delete test events and orders from EventQL database
docker-compose exec -T eventql /rails/bin/rails runner "
  # Delete test events
  events = Event.where('name LIKE ?', 'Test Event %')
  event_count = events.count
  events.destroy_all
  puts \"✓ Deleted #{event_count} test events\"

  # Delete test user's orders
  user = User.find_by(email: '$TEST_USER_EMAIL')
  if user
    order_count = user.orders.count
    user.orders.destroy_all
    puts \"✓ Deleted #{order_count} orders for test user\"
  end
"

echo ""
echo "Cleaning up EventREST (REST API)..."

# Delete test events and orders from EventREST database
docker-compose exec -T event-rest /rails/bin/rails runner "
  # Delete test events
  events = Event.where('name LIKE ?', 'Test Event %')
  event_count = events.count
  events.destroy_all
  puts \"✓ Deleted #{event_count} test events\"

  # Delete test user's orders
  user = User.find_by(email: '$TEST_USER_EMAIL')
  if user
    order_count = user.orders.count
    user.orders.destroy_all
    puts \"✓ Deleted #{order_count} orders for test user\"
  end
"

echo ""
echo "============================================"
echo "Cleanup completed!"
echo "============================================"

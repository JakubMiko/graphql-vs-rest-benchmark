#!/bin/bash
# Wrapper script for concurrent users tests with automatic cleanup
# This ensures cleanup happens automatically after tests
# Usage: ./scripts/run-concurrent-test.sh <test-type> <api> <phase-name>
# Example: ./scripts/run-concurrent-test.sh load graphql before_optimization

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <test-type> <api> <phase-name>"
    echo "Example: $0 load graphql before_optimization"
    echo ""
    echo "Test types: load, stress, spike, soak"
    echo "APIs: graphql, rest"
    echo "Phases: before_optimization, after_optimization"
    exit 1
fi

TEST_TYPE=$1
API=$2
PHASE_NAME=$3
TEST_USER_EMAIL="test@benchmark.com"

echo "============================================"
echo "Concurrent Users Test with Auto-Cleanup"
echo "============================================"
echo "Test Type: $TEST_TYPE"
echo "API: $API"
echo "Phase: $PHASE_NAME"
echo ""

# Function to count orders for test user in a specific database
count_orders() {
    local service=$1
    local count=$(docker-compose exec -T $service /rails/bin/rails runner "
      user = User.find_by(email: '$TEST_USER_EMAIL')
      puts user ? user.orders.count : 0
    " 2>/dev/null | tail -1)
    echo $count
}

# Get service name based on API
if [ "$API" = "graphql" ]; then
    SERVICE="eventql"
else
    SERVICE="event-rest"
fi

echo "Checking current order count..."
ORDERS_BEFORE=$(count_orders $SERVICE)
echo "Orders before test: $ORDERS_BEFORE"
echo ""

echo "============================================"
echo "Running k6 test..."
echo "============================================"
echo ""

# Change to project root and run the actual test (this is timed by k6)
cd "$PROJECT_ROOT"
./scripts/run-test.sh concurrent-users $TEST_TYPE $API $PHASE_NAME

echo ""
echo "============================================"
echo "Test completed! Checking results..."
echo "============================================"
echo ""

ORDERS_AFTER=$(count_orders $SERVICE)
ORDERS_CREATED=$((ORDERS_AFTER - ORDERS_BEFORE))

echo "Orders before test:  $ORDERS_BEFORE"
echo "Orders after test:   $ORDERS_AFTER"
echo "Orders created:      $ORDERS_CREATED"
echo ""

if [ $ORDERS_CREATED -gt 0 ]; then
    echo "Cleaning up $ORDERS_CREATED test orders..."
    echo ""

    # Run cleanup for this specific API only
    docker-compose exec -T $SERVICE /rails/bin/rails runner "
      user = User.find_by(email: '$TEST_USER_EMAIL')
      if user
        count = user.orders.count
        user.orders.destroy_all
        puts \"✓ Deleted #{count} orders from $API database\"
      else
        puts '✗ Test user not found'
      end
    "

    echo ""
    ORDERS_FINAL=$(count_orders $SERVICE)
    echo "Orders after cleanup: $ORDERS_FINAL"

    if [ $ORDERS_FINAL -eq $ORDERS_BEFORE ]; then
        echo "✓ Cleanup successful - database restored to initial state"
    else
        echo "⚠ Warning: Order count mismatch (expected $ORDERS_BEFORE, got $ORDERS_FINAL)"
    fi
else
    echo "No orders were created (test may have failed)"
fi

echo ""
echo "============================================"
echo "Done!"
echo "============================================"

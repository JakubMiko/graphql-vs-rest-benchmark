#!/bin/bash
# Wrapper script for write operations tests with automatic cleanup
# This ensures cleanup happens automatically after tests but doesn't affect test metrics
# Usage: ./scripts/run-write-test.sh <test-type> <api> <phase-name>
# Example: ./scripts/run-write-test.sh load graphql before_optimization

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <test-type> <api> <phase-name>"
    echo "Example: $0 load graphql before_optimization"
    echo ""
    echo "Test types: load, stress"
    echo "APIs: graphql, rest"
    echo "Phases: before_optimization, after_optimization"
    exit 1
fi

TEST_TYPE=$1
API=$2
PHASE_NAME=$3

echo "============================================"
echo "Write Operations Test with Auto-Cleanup"
echo "============================================"
echo "Test Type: $TEST_TYPE"
echo "API: $API"
echo "Phase: $PHASE_NAME"
echo ""

# Function to count test events in a specific database
count_events() {
    local service=$1
    local count=$(docker-compose exec -T $service /rails/bin/rails runner "
      events = Event.where('name LIKE ?', 'Test Event %')
      puts events.count
    " 2>/dev/null | tail -1)
    echo $count
}

# Get service name based on API
if [ "$API" = "graphql" ]; then
    SERVICE="eventql"
else
    SERVICE="event-rest"
fi

echo "Checking current test event count..."
EVENTS_BEFORE=$(count_events $SERVICE)
echo "Test events before: $EVENTS_BEFORE"
echo ""

echo "============================================"
echo "Running k6 test..."
echo "============================================"
echo ""

# Change to project root and run the actual test (this is timed by k6)
cd "$PROJECT_ROOT"
./scripts/run-test.sh write-operations $TEST_TYPE $API $PHASE_NAME

echo ""
echo "============================================"
echo "Test completed! Checking results..."
echo "============================================"
echo ""

EVENTS_AFTER=$(count_events $SERVICE)
EVENTS_CREATED=$((EVENTS_AFTER - EVENTS_BEFORE))

echo "Test events before:  $EVENTS_BEFORE"
echo "Test events after:   $EVENTS_AFTER"
echo "Events created:      $EVENTS_CREATED"
echo ""

if [ $EVENTS_CREATED -gt 0 ]; then
    echo "Cleaning up $EVENTS_CREATED test events..."
    echo ""

    # Run cleanup for this specific API only
    docker-compose exec -T $SERVICE /rails/bin/rails runner "
      events = Event.where('name LIKE ?', 'Test Event %')
      count = events.count
      events.destroy_all
      puts \"✓ Deleted #{count} test events from $API database\"
    "

    echo ""
    EVENTS_FINAL=$(count_events $SERVICE)
    echo "Events after cleanup: $EVENTS_FINAL"

    if [ $EVENTS_FINAL -eq $EVENTS_BEFORE ]; then
        echo "✓ Cleanup successful - database restored to initial state"
    else
        echo "⚠ Warning: Event count mismatch (expected $EVENTS_BEFORE, got $EVENTS_FINAL)"
    fi
else
    echo "No test events were created (test may have failed)"
fi

echo ""
echo "============================================"
echo "Done!"
echo "============================================"

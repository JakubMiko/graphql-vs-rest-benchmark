#!/bin/bash
# Quick script to run a single k6 test
# Usage: ./scripts/run-test.sh <scenario-path> <api> <phase>
# Example: ./scripts/run-test.sh k6/scenarios/01-simple-read/load-graphql.js graphql 1

set -e

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <test-script-path> <api> <phase>"
    echo "Example: $0 k6/scenarios/01-simple-read/load-graphql.js graphql 1"
    exit 1
fi

TEST_SCRIPT_FULL=$1
API=$2
PHASE=$3

# Remove 'k6/' prefix if present
TEST_SCRIPT=$(echo "$TEST_SCRIPT_FULL" | sed 's|^k6/||')

# Extract scenario number from path
SCENARIO=$(echo $TEST_SCRIPT | grep -o '[0-9]\{2\}-[a-z-]*' | head -1 | cut -d'-' -f1)

# InfluxDB v2 configuration
INFLUX_URL="http://influxdb:8086"
INFLUX_ORG="benchmark"
INFLUX_BUCKET="k6"
INFLUX_TOKEN="benchmark-admin-token-change-in-production"

echo "============================================"
echo "Running k6 Test"
echo "============================================"
echo "Test: $TEST_SCRIPT_FULL"
echo "API: $API"
echo "Phase: $PHASE"
echo "Scenario: $SCENARIO"
echo "============================================"
echo ""

# Get absolute path to k6 directory
K6_DIR="$(cd "$(dirname "$0")/.." && pwd)/k6"

# Use custom k6 image with InfluxDB v2 support
docker run --rm -i \
  --network=graphql-vs-rest-benchmark_benchmark \
  -v "$K6_DIR:/k6" \
  -e K6_INFLUXDB_ORGANIZATION=$INFLUX_ORG \
  -e K6_INFLUXDB_BUCKET=$INFLUX_BUCKET \
  -e K6_INFLUXDB_TOKEN=$INFLUX_TOKEN \
  custom-k6:latest run \
  --out xk6-influxdb=$INFLUX_URL \
  --tag api=$API \
  --tag phase=$PHASE \
  --tag scenario=$SCENARIO \
  /k6/$TEST_SCRIPT

echo ""
echo "============================================"
echo "Test completed!"
echo "View results at: http://localhost:3030"
echo "============================================"

#!/bin/bash
# Quick script to run a single k6 test
# Usage: ./scripts/run-test.sh <scenario-name> <test-type> <api> <phase-name>
# Example: ./scripts/run-test.sh simple-read load graphql before_optimization

set -e

if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <scenario-name> <test-type> <api> <phase-name>"
    echo "Example: $0 simple-read load graphql before_optimization"
    echo ""
    echo "Scenarios: simple-read, nested-data, selective-fields, write-operations, concurrent-users"
    echo "Test types: load, stress, spike, soak"
    echo "APIs: graphql, rest"
    echo "Phases: before_optimization, after_optimization"
    exit 1
fi

SCENARIO_NAME=$1
TEST_TYPE=$2
API=$3
PHASE_NAME=$4

# Map scenario names to folder names
case $SCENARIO_NAME in
    simple-read)
        SCENARIO_FOLDER="01-simple-read"
        SCENARIO_NUM="01"
        RESULTS_FOLDER="01-simple-read"
        ;;
    nested-data)
        SCENARIO_FOLDER="02-nested-data"
        SCENARIO_NUM="02"
        RESULTS_FOLDER="02-nested-data"
        ;;
    selective-fields)
        SCENARIO_FOLDER="03-selective-fields"
        SCENARIO_NUM="03"
        RESULTS_FOLDER="03-selective-fields"
        ;;
    write-operations)
        SCENARIO_FOLDER="04-write-operations"
        SCENARIO_NUM="04"
        RESULTS_FOLDER="04-write-operations"
        ;;
    concurrent-users)
        SCENARIO_FOLDER="05-concurrent-users"
        SCENARIO_NUM="05"
        RESULTS_FOLDER="05-concurrent-users"
        ;;
    *)
        echo "Unknown scenario: $SCENARIO_NAME"
        exit 1
        ;;
esac

# Build test script path
TEST_SCRIPT="scenarios/${SCENARIO_FOLDER}/${TEST_TYPE}-${API}.js"
TEST_SCRIPT_FULL="k6/${TEST_SCRIPT}"

# Check if test script exists
if [ ! -f "$TEST_SCRIPT_FULL" ]; then
    echo "Error: Test script not found: $TEST_SCRIPT_FULL"
    exit 1
fi

# Create results directory (using sequential numbering)
RESULTS_DIR="docs/results/${PHASE_NAME}/${RESULTS_FOLDER}"
mkdir -p "$RESULTS_DIR"

# Generate timestamp for this test run
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SUMMARY_FILE="${RESULTS_DIR}/${TEST_TYPE}-${API}-${TIMESTAMP}.txt"

# InfluxDB v2 configuration
INFLUX_URL="http://influxdb:8086"
INFLUX_ORG="benchmark"
INFLUX_BUCKET="k6"
INFLUX_TOKEN="benchmark-admin-token-change-in-production"

echo "============================================"
echo "Running k6 Test"
echo "============================================"
echo "Scenario: $SCENARIO_NAME"
echo "Test Type: $TEST_TYPE"
echo "API: $API"
echo "Phase: $PHASE_NAME"
echo "Script: $TEST_SCRIPT_FULL"
echo ""
echo "InfluxDB Tags:"
echo "  --tag api=$API"
echo "  --tag phase=$PHASE_NAME"
echo "  --tag scenario=$SCENARIO_NUM"
echo "============================================"
echo ""

# Get absolute path to k6 directory
K6_DIR="$(cd "$(dirname "$0")/.." && pwd)/k6"

# Create metadata header for summary file
cat > "$SUMMARY_FILE" << EOF
================================================================================
K6 TEST SUMMARY
================================================================================
Scenario:     $SCENARIO_NAME
Test Type:    $TEST_TYPE
API:          $API
Phase:        $PHASE_NAME
Test Script:  $TEST_SCRIPT_FULL
Timestamp:    $(date '+%Y-%m-%d %H:%M:%S')

================================================================================
INFLUXDB QUERY INFORMATION
================================================================================
To query this test data in InfluxDB, use:

from(bucket: "$INFLUX_BUCKET")
  |> range(start: $(date -u +%Y-%m-%dT%H:%M:%SZ), stop: now())
  |> filter(fn: (r) => r["api"] == "$API")
  |> filter(fn: (r) => r["phase"] == "$PHASE_NAME")
  |> filter(fn: (r) => r["scenario"] == "$SCENARIO_NUM")

InfluxDB URL: http://localhost:8086
Organization: $INFLUX_ORG
Bucket: $INFLUX_BUCKET

================================================================================
GRAFANA SNAPSHOT
================================================================================
[MANUAL] Add Grafana snapshot link here after test completion:


================================================================================
TEST OUTPUT
================================================================================

EOF

# Run test and capture ONLY the final summary (not continuous output)
# This prevents huge files for long-running tests (e.g., 2-hour soak tests)
docker run --rm -i \
  --network=graphql-vs-rest-benchmark_benchmark \
  -v "$K6_DIR:/k6" \
  -e K6_INFLUXDB_ORGANIZATION=$INFLUX_ORG \
  -e K6_INFLUXDB_BUCKET=$INFLUX_BUCKET \
  -e K6_INFLUXDB_TOKEN=$INFLUX_TOKEN \
  -e K6_INFLUXDB_TAGS_API=$API \
  -e K6_INFLUXDB_TAGS_PHASE=$PHASE_NAME \
  -e K6_INFLUXDB_TAGS_SCENARIO=$SCENARIO_NUM \
  custom-k6:latest run \
  --out xk6-influxdb=$INFLUX_URL \
  --tag api=$API \
  --tag phase=$PHASE_NAME \
  --tag scenario=$SCENARIO_NUM \
  /k6/$TEST_SCRIPT 2>&1 | tee /dev/tty | tail -n 150 >> "$SUMMARY_FILE"

# Just show where results were saved (k6's handleSummary already shows "Test completed!")
echo ""
echo "============================================"
echo "Summary saved to: $SUMMARY_FILE"
echo "View real-time metrics: http://localhost:3030"
echo ""
echo "Next steps:"
echo "1. Take a Grafana snapshot at http://localhost:3030"
echo "2. Add the snapshot link to: $SUMMARY_FILE"
echo "============================================"

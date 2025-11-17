# Test Results

This directory contains all test results organized by phase and scenario.

## Structure

```
results/
├── before_optimization/       # Phase 1: Baseline (no pagination, no caching)
│   ├── 01-simple-read/
│   ├── 02-nested-data/
│   ├── 03-selective-fields/
│   ├── 04-write-operations/
│   └── 05-concurrent-users/
└── after_optimization/        # Phase 2: Optimized (pagination + caching)
    ├── 01-simple-read/
    ├── 02-nested-data/
    ├── 03-selective-fields/
    ├── 04-write-operations/
    └── 05-concurrent-users/
```

## File Naming Convention

Each test result file follows this pattern:
```
{test-type}-{api}-{timestamp}.txt
```

Examples:
- `load-graphql-20251116_143022.txt` - Load test for GraphQL API
- `stress-rest-20251116_150430.txt` - Stress test for REST API
- `soak-graphql-20251116_160000.txt` - Soak test for GraphQL API

## Summary File Contents

Each summary file includes:

1. **Test Metadata** - Scenario, test type, API, phase, timestamp
2. **InfluxDB Query** - Ready-to-use Flux query to retrieve this test's data
3. **Grafana Snapshot** - Manual placeholder for snapshot link
4. **Test Output** - Complete k6 test summary with all metrics

## How to Use

### Running a Test

```bash
./scripts/run-test.sh <scenario-name> <test-type> <api> <phase-name>
```

Examples:
```bash
# Run simple read load test for GraphQL (baseline)
./scripts/run-test.sh simple-read load graphql before_optimization

# Run nested data stress test for REST (optimized)
./scripts/run-test.sh nested-data stress rest after_optimization

# Run concurrent users soak test for GraphQL (baseline)
./scripts/run-test.sh concurrent-users soak graphql before_optimization
```

### After Running a Test

1. The summary is automatically saved to the appropriate folder
2. Go to Grafana at http://localhost:3030
3. Create a snapshot of the dashboard showing the test results
4. Edit the summary file and paste the snapshot link in the designated section

### Querying Results in InfluxDB

Each summary file contains a ready-to-use Flux query. You can:

1. Go to http://localhost:8086
2. Navigate to Data Explorer
3. Copy the query from the summary file
4. Adjust the time range if needed
5. Execute to see the raw metrics

## Available Scenarios

| Scenario | Test Types | Description |
|----------|-----------|-------------|
| simple-read | load | Single user by ID - baseline comparison |
| nested-data | load, stress, spike, soak | Users with orders - N+1 problem test |
| selective-fields | load | Events with selective fields - over-fetching test |
| write-operations | load, stress | Create order - mutation performance |
| concurrent-users | load, stress, spike, soak | Realistic user journey - end-to-end test |

## Comparing Results

To compare GraphQL vs REST for a scenario:
1. Run the same test for both APIs in the same phase
2. Compare the summary files side-by-side
3. Look at key metrics:
   - `http_req_duration` - Total response time
   - `http_req_waiting` - Server processing time
   - `http_reqs` - Throughput
   - `data_received` - Bytes transferred (important for selective-fields)
   - `http_req_failed` - Error rate

To compare before vs after optimization:
1. Run the same test for the same API in both phases
2. Calculate improvement: `(after - before) / before × 100%`
3. Negative % = improvement (faster), Positive % = degradation (slower)

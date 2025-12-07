# Phase 1: Baseline Performance Testing - Methodology

**Git Tag:** `v1.0-phase1-baseline`
**Date:** December 2025
**Status:** Completed

## Overview

Phase 1 establishes baseline performance metrics for GraphQL vs REST APIs **without any optimizations**. This phase measures raw architectural differences before implementing pagination or caching strategies.

## Test Configuration

### Environment Setup

**Application State:**
- **Cache:** Disabled (`DISABLE_CACHE=true`)
- **Pagination:** Implemented (20 items per page default)
- **Environment:** Production mode (`RAILS_ENV=production`)
- **Database:** PostgreSQL with 140,602 orders, 611,256 tickets (identical data for both APIs)

**Infrastructure:**
- Docker containers with resource limits (2 CPU, 4GB RAM per app)
- Redis available but unused (cache disabled)
- InfluxDB for metrics storage
- Grafana for real-time monitoring

### Test User

Special test user created for reproducible tests:
- **Email:** `test@benchmark.com`
- **Password:** `password123`
- **Orders:** Always cleaned up after each test run
- **Purpose:** Ensures consistent authentication and data state

## Test Scenarios

Phase 1 focuses on **LOAD TESTS ONLY** with **shared-iterations executor**. This approach:
- Measures time to complete a fixed number of iterations
- Ensures fair comparison (both APIs execute same workload)
- Eliminates variability from time-based executors
- Focuses on throughput and latency under normal load

### Why Only Load Tests?

**Rationale:**
- Stress, spike, and soak tests were **deprioritized** for Phase 1
- Focus on **baseline comparison** under normal conditions
- Time constraint: Running all test types (load, stress, spike, soak) × 5 scenarios × 2 APIs = 40 tests
- Load tests provide sufficient data for architectural comparison

**What was excluded:**
- ❌ Stress tests (finding breaking points)
- ❌ Spike tests (sudden traffic bursts)
- ❌ Soak tests (long-term stability, 2h duration)
- ❌ Ramp-up tests (gradual load increase)

These test types will be reconsidered for Phase 2 if time permits.

### Scenario 1: Simple Read

**Purpose:** Baseline simplicity test with no relationships

**Endpoints:**
- GraphQL: `query { user(id: X) { id firstName lastName email } }`
- REST: `GET /users/:id`

**Configuration:**
- VUs: 20
- Iterations: 3000 (shared)
- Duration: ~2-3 minutes
- Expected: Similar performance (simple fetch, no N+1)

**Script:** `./scripts/run-test.sh simple-read load {graphql|rest} before_optimization`

---

### Scenario 2: Nested Data (N+1 Problem Test) ⭐

**Purpose:** Key differentiator - test N+1 query problem and DataLoader effectiveness

**Endpoints:**
- GraphQL: Single request with DataLoader batching
  ```graphql
  query {
    events(first: 20) {
      edges {
        node {
          id
          name
          ticketBatches { id price availableTickets }
        }
      }
    }
  }
  ```
- REST: Multiple requests (1 + N pattern)
  - `GET /events?page=1&per_page=20` → Get 20 events
  - `GET /events/:id/ticket_batches` → 20 separate requests for ticket batches

**Configuration:**
- VUs: 20
- Iterations: 3000 (shared)
- Expected: GraphQL 40-60% faster (fewer HTTP round trips, DataLoader batching)

**Script:** `./scripts/run-test.sh nested-data load {graphql|rest} before_optimization`

**Key Metric:** Total HTTP request count (GraphQL: ~3000, REST: ~63,000)

---

### Scenario 3: Selective Fields (Over-fetching Test) ⭐

**Purpose:** Demonstrate GraphQL's selective field fetching vs REST over-fetching

**Endpoints:**
- GraphQL: Request only 2 fields
  ```graphql
  query {
    events(first: 20) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
  ```
- REST: Returns ALL fields
  ```
  GET /events?page=1&per_page=20
  → Returns: id, name, description, place, date, category, created_at, updated_at, relationships
  ```

**Configuration:**
- VUs: 20
- Iterations: 10,000 (shared) - higher iterations to amplify data transfer difference
- Expected: GraphQL 60-80% less data transferred

**Script:** `./scripts/run-test.sh selective-fields load {graphql|rest} before_optimization`

**Key Metric:** `data_received` (GraphQL ~4 KB/request, REST ~17 KB/request)

---

### Scenario 4: Write Operations

**Purpose:** Compare mutation/POST performance for creating orders

**Endpoints:**
- GraphQL: `mutation { createOrder(input: {...}) { order { id status } } }`
- REST: `POST /orders`

**Configuration:**
- VUs: 20
- Iterations: 3000 (shared)
- Expected: Similar performance (both do database writes)
- Cleanup: Orders deleted after test via `cleanup-test-data.sh`

**Script:** `./scripts/run-test.sh write-operations load {graphql|rest} before_optimization`

---

### Scenario 5: Concurrent Users (Real-world Journey) ⭐

**Purpose:** Most important real-world test simulating complete user journey

**User Flow:**
1. Browse events (GET /events or events query)
2. View event details (GET /events/:id or event(id) query)
3. Login (POST /users/login or login mutation)
4. Create order (POST /orders or createOrder mutation)
5. View my orders (GET /orders or myOrders query)

**Configuration:**
- VUs: 20
- Iterations: 3000 (shared)
- Expected: GraphQL more efficient (fewer requests), REST faster (less parsing overhead)
- Cleanup: Automated via `run-concurrent-test.sh`

**Script:** `./scripts/run-concurrent-test.sh load {graphql|rest} before_optimization`

**Key Metrics:**
- End-to-end journey time
- `data_received` (GraphQL should transfer less)
- Success rate

---

## Test Execution

### Running Individual Tests

```bash
# Pattern: ./scripts/run-test.sh <scenario> load <api> before_optimization

./scripts/run-test.sh simple-read load graphql before_optimization
./scripts/run-test.sh simple-read load rest before_optimization

./scripts/run-test.sh nested-data load graphql before_optimization
./scripts/run-test.sh nested-data load rest before_optimization

./scripts/run-test.sh selective-fields load graphql before_optimization
./scripts/run-test.sh selective-fields load rest before_optimization

./scripts/run-test.sh write-operations load graphql before_optimization
./scripts/run-test.sh write-operations load rest before_optimization

# Concurrent users (with auto-cleanup)
./scripts/run-concurrent-test.sh load graphql before_optimization
./scripts/run-concurrent-test.sh load rest before_optimization
```

### Results Location

All test results are saved to:
```
docs/results/before_optimization/
├── 01-simple-read/
│   ├── load-graphql-TIMESTAMP.txt
│   └── load-rest-TIMESTAMP.txt
├── 02-nested-data/
│   ├── load-graphql-TIMESTAMP.txt
│   └── load-rest-TIMESTAMP.txt
├── 03-selective-fields/
│   ├── load-graphql-TIMESTAMP.txt
│   └── load-rest-TIMESTAMP.txt
├── 04-write-operations/
│   ├── load-graphql-TIMESTAMP.txt
│   └── load-rest-TIMESTAMP.txt
└── 05-concurrent-users/
    ├── load-graphql-TIMESTAMP.txt
    └── load-rest-TIMESTAMP.txt
```

Each result file contains:
- Test metadata (timestamp, scenario, API, phase)
- InfluxDB query for reproducing analysis
- k6 output (iterations, VUs, duration)
- HTTP metrics (req_duration, req_failed, data_received/sent)
- Standard deviation analysis
- Custom summary with trend stats

## Key Metrics Tracked

### Performance Metrics (k6)

| Metric | Description | Target |
|--------|-------------|--------|
| `http_req_duration` | Total request time | avg <300ms, p95 <500ms |
| `http_req_waiting` | Server processing time | avg <150ms, p95 <300ms |
| `http_reqs` | Throughput (req/s) | >100 req/s |
| `http_req_failed` | Error rate | <1% |
| `iteration_duration` | Full iteration time | Varies by scenario |
| **`data_received`** | **Bytes received** | **Key for over-fetching test** |
| **`data_sent`** | **Bytes sent** | GraphQL higher (POST bodies) |

### Success Criteria

✅ **Test is valid if:**
- Both APIs complete same number of iterations
- 0% failed requests
- Cache disabled (`DISABLE_CACHE=true`)
- Identical database state

## Important Changes from Original Plan

### 1. Pagination Added to Phase 1

**Original Plan:** No pagination in Phase 1 (baseline)

**Actual Implementation:** Pagination added in Phase 1 for `/orders` and `myOrders`

**Reason:** Without pagination, `/orders` endpoint returned ALL user orders causing:
- Exponential response size growth (7+ MB responses after 1500 orders)
- Unfair comparison (GraphQL N+1 test vs REST no-pagination test)
- Test failures due to massive data transfer

**Impact:** Fair comparison achieved, but Phase 1 is not a "pure baseline"

### 2. Shared-Iterations Executor Only

**Original Plan:** Multiple test types (load, stress, spike, soak)

**Actual Implementation:** Load tests only with shared-iterations executor

**Reason:**
- Time constraints (40 tests → 10 tests)
- Shared-iterations ensures fair comparison (same workload)
- Load tests sufficient for baseline comparison

### 3. Scenario Numbering

Note: Scenario numbering in folder structure (01-05) differs from CLAUDE.md (which skips some numbers due to excluded scenarios). Both are correct - folders use sequential numbering for simplicity.

## Data Consistency

### Database Seeding

Both applications use **identical deterministic seed data:**
- Seed: `Random.srand(42)` and `Faker::Config.random = Random.new(42)`
- Users: 10,001 (including test user)
- Events: 15,000 (10,000 past, 5,000 future)
- TicketBatches: 90,000
- Orders: 140,602
- Tickets: 611,256

### Test User Management

The test user (`test@benchmark.com`) is critical for concurrent-users test:
- Created during seed with 0 orders
- Orders created during test
- **Must be cleaned up** after each test run
- Cleanup automated in `run-concurrent-test.sh`

## Monitoring

### Real-time Monitoring

**Grafana Dashboard:** http://localhost:3030 (admin/admin)
- Overview dashboard comparing all scenarios
- Per-phase dashboards for detailed analysis
- Live metrics during test execution

**InfluxDB:** http://localhost:8086 (admin/adminpassword123)
- Raw metrics storage
- Query using InfluxDB Flux language
- Each test tagged with: `api`, `phase`, `scenario`

### Querying Results

Example InfluxDB query:
```flux
from(bucket: "k6")
  |> range(start: 2025-12-07T00:00:00Z, stop: now())
  |> filter(fn: (r) => r["api"] == "graphql")
  |> filter(fn: (r) => r["phase"] == "before_optimization")
  |> filter(fn: (r) => r["scenario"] == "05")
```

## Expected Outcomes

### GraphQL Expected to Win:

1. **Nested Data (Scenario 2):** 40-60% faster
   - Fewer HTTP requests (1 vs 1+N)
   - DataLoader batching

2. **Selective Fields (Scenario 3):** 60-80% less data transfer
   - Only requested fields returned
   - No over-fetching

3. **Concurrent Users (Scenario 5):** Lower data transfer
   - Combined benefits of above

### REST Expected to Win:

1. **Simple Read (Scenario 1):** 5-10% faster
   - Less parsing overhead
   - Simpler request/response

2. **Write Operations (Scenario 4):** Similar or slightly faster
   - Both do same DB operations
   - REST simpler payload

### Tie Expected:

- **Performance under normal load:** Both should handle load well
- **Success rate:** Both should have 0% errors

## Next Steps

After Phase 1 completion:

1. **Analyze results** - Compare all metrics across scenarios
2. **Identify bottlenecks** - Where did each API struggle?
3. **Document findings** - Create comparison tables and charts
4. **Plan Phase 2** - Design optimization strategies based on Phase 1 data

## Phase 2 Preview

**Phase 2 (Optimized)** will add:
- **GraphQL:** Query-level caching (Rails.cache + Redis, 5min TTL)
- **REST:** HTTP caching (ETag, Cache-Control headers)
- **Both:** Already have pagination (added in Phase 1)

Expected improvements:
- GraphQL: 30-50% latency reduction (cached queries)
- REST: 40-60% data transfer reduction (304 Not Modified responses)

---

## Troubleshooting

### Common Issues

**Issue:** Different iteration counts between GraphQL and REST
- **Cause:** One API slower, doesn't finish all iterations in time
- **Solution:** Use shared-iterations executor (fixes this automatically)

**Issue:** Massive `data_received` in concurrent-users test
- **Cause:** Missing pagination on `/orders` or `myOrders`
- **Solution:** Verify pagination parameters in test scripts

**Issue:** Test user has orders before test
- **Cause:** Previous test not cleaned up
- **Solution:** Run cleanup script or manually delete: `User.find_by(email: 'test@benchmark.com').orders.destroy_all`

**Issue:** Cache metrics showing hits
- **Cause:** `DISABLE_CACHE` not set or not working
- **Solution:** Verify with `docker-compose exec eventql env | grep DISABLE_CACHE`

### Validation Checklist

Before running Phase 1 tests, verify:

- [ ] Cache disabled in both apps (`DISABLE_CACHE=true`)
- [ ] Database seeded with identical data
- [ ] Test user has 0 orders
- [ ] Docker containers running with resource limits
- [ ] InfluxDB and Grafana accessible
- [ ] k6 scripts updated with pagination
- [ ] Previous test results archived (if rerunning)

---

**Document Version:** 1.0
**Last Updated:** December 7, 2025
**Author:** Jakub Mikołajczyk
**Thesis:** GraphQL vs REST Performance Comparison

# Load Test Results: Nested Data (N+1 Problem)

**Test Date:** 2025-11-23
**Phase:** After Optimization (Pagination + Caching)
**Scenario:** Events → Ticket Batches (10 events, ~6 ticket batches each)
**Duration:** 5 minutes
**Load:** 50 VUs (Virtual Users)

---

## Executive Summary

GraphQL demonstrated **significant performance advantages** over REST in the nested data scenario, completing **82% more iterations** with **8.7x faster response times**. With proper caching implemented on both APIs, the architectural differences become even more apparent.

**Winner:** GraphQL ✅

---

## Caching Strategy Change (Important Context)

### Why We Changed the Caching Approach

During initial testing, GraphQL used **resolver-level caching** (caching parts separately):
- Event IDs cached in `ListEvents` resolver
- Ticket batches cached in `TicketBatchesResolver`
- Result: Still 1 DB query on cache hit (`Event.where(id: cached_ids)`)
- Response time: ~40ms cached

REST used **endpoint-level caching** (caching full response):
- Entire serialized JSON cached
- Result: 0 DB queries on cache hit
- Response time: ~7ms cached

**This was not a fair comparison!**

### Solution: Controller-Level Caching for GraphQL

We implemented full response caching at the GraphQL controller level to match REST's approach:

```ruby
# GraphqlController - caches entire response
cache_key = "graphql:#{MD5(query + variables)}"
Rails.cache.fetch(cache_key) { execute_query }
```

**After the change:**
| Metric | GraphQL | REST |
|--------|---------|------|
| Cache strategy | Full response | Full response |
| DB queries (cache hit) | 0 | 0 |
| Cached response time | ~5-10ms | ~5-7ms |

**Now the comparison is fair** - both APIs cache at the same level.

### Trade-offs

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **Resolver-level** (parts) | Reusable across queries, granular | More cache lookups, still some queries | Production apps |
| **Controller-level** (full) | Fastest, 0 queries | Less reusable, per-query cache | Benchmarking, high-traffic endpoints |

---

## Performance Comparison

| Metric | GraphQL | REST | Difference | Winner |
|--------|---------|------|------------|--------|
| **Throughput** | 11,919 iterations | 6,534 iterations | **82% more** | GraphQL ✅ |
| **Iterations/sec** | 39.65/s | 21.75/s | **82% faster** | GraphQL ✅ |
| **Avg Response Time** | 8.81ms | 76.74ms | **8.7x faster** | GraphQL ✅ |
| **p95 Latency** | 19.84ms | 143.76ms | **7.2x better** | GraphQL ✅ |
| **p90 Latency** | 16.40ms | 132.24ms | **8.1x better** | GraphQL ✅ |
| **Max Latency** | 93.59ms | 297.30ms | **3.2x better** | GraphQL ✅ |
| **HTTP Requests** | 11,919 | 71,874 | **6x fewer** | GraphQL ✅ |
| **Requests/iteration** | 1 | 11 | **11x fewer** | GraphQL ✅ |
| **Data Received** | 102.7 MB | 405.8 MB | **75% less** | GraphQL ✅ |
| **Data/iteration** | 8.6 KB | 62.1 KB | **7.2x less** | GraphQL ✅ |
| **Success Rate** | 100.0% | 100.0% | Equal | Tie |
| **Thresholds Passed** | ✅ All | ✅ All | Equal | Tie |

---

## Key Findings

### 1. Throughput: GraphQL 82% More Iterations ⭐

**GraphQL completed 82% more user transactions** in the same 5-minute window:
- GraphQL: 11,919 complete transactions
- REST: 6,534 complete transactions

With caching, GraphQL's single-request architecture allows it to serve significantly more users.

### 2. Response Time: GraphQL 8.7x Faster ⚡

With both APIs using full response caching:
- GraphQL avg: **8.81ms** ✅
- REST avg: **76.74ms**

**Why the difference?** GraphQL makes 1 HTTP request per iteration. REST makes 11 HTTP requests per iteration (1 for events + 10 for ticket_batches). Even with caching, REST has HTTP overhead × 11.

### 3. N+1 Problem: Still Present in REST 📊

**HTTP Request Pattern:**
```
GraphQL: 1 HTTP request per user action
  └─ Single cached response (events + ticket batches)

REST: 11 HTTP requests per user action (N+1 pattern)
  ├─ 1 request: GET /events?page=1&per_page=10 (cached)
  └─ 10 requests: GET /events/:id/ticket_batches (cached individually)
```

**Total HTTP requests during test:**
- GraphQL: 11,919 (1 per iteration)
- REST: 71,874 (11 per iteration)

**Impact:** Even with caching, REST's 11 HTTP requests add overhead that GraphQL avoids entirely.

### 4. Data Transfer: GraphQL 75% Less 📉

**GraphQL:** 102.7 MB total (8.6 KB per iteration)
- Returns only requested fields
- Single response with events + ticket batches

**REST:** 405.8 MB total (62.1 KB per iteration)
- Returns full event objects with all fields
- Includes ticket_batches in events response (over-fetching)

### 5. Latency Consistency: GraphQL More Predictable ✓

| Percentile | GraphQL | REST | Analysis |
|------------|---------|------|----------|
| **Median (p50)** | 7.52ms | 87.99ms | GraphQL 11.7x faster |
| **p90** | 16.40ms | 132.24ms | GraphQL 8.1x faster |
| **p95** | 19.84ms | 143.76ms | GraphQL 7.2x faster |
| **Max** | 93.59ms | 297.30ms | GraphQL 3.2x faster |

GraphQL shows **consistent low latency** across all percentiles.

---

## Comparison with Before Optimization

| Metric | Before Opt (GraphQL) | After Opt (GraphQL) | Improvement |
|--------|---------------------|---------------------|-------------|
| Iterations | 8,289 | 11,919 | **+44%** |
| Avg Response | 452ms | 8.81ms | **51x faster** |
| p95 Latency | 924ms | 19.84ms | **46x better** |
| Data Received | 95.8 MB | 102.7 MB | Similar |

| Metric | Before Opt (REST) | After Opt (REST) | Improvement |
|--------|------------------|------------------|-------------|
| Iterations | 1,982 | 6,534 | **3.3x more** |
| Avg Response | 464ms | 76.74ms | **6x faster** |
| p95 Latency | 5.05s | 143.76ms | **35x better** |
| Data Received | 900.5 MB | 405.8 MB | **55% less** |

**Key improvements from optimization:**
- Both APIs significantly faster due to caching
- REST improved more dramatically (was fetching all 15K events before)
- GraphQL maintains its architectural advantage

---

## Test Configuration

### Common Settings
- **Duration:** 5 minutes
- **Ramp-up:** 1 minute (0 → 50 VUs)
- **Sustained load:** 3 minutes (50 VUs)
- **Ramp-down:** 1 minute (50 → 0 VUs)
- **Think time:** 1 second between requests

### GraphQL Query
```graphql
query GetEventsWithTicketBatches {
  events(first: 10) {
    nodes {
      id
      name
      place
      date
      ticketBatches {
        id
        price
        availableTickets
        saleStart
        saleEnd
      }
    }
    totalCount
  }
}
```
- **Pagination:** Cursor-based (first: 10)
- **Caching:** Controller-level full response (5-minute TTL)

### REST Endpoints
```
GET /events?page=1&per_page=10
  → Returns: 10 events with ticket_batches included
  → Caching: Full response cached (5-minute TTL)

GET /events/:id/ticket_batches (× 10)
  → Returns: Ticket batches for each event
  → Caching: Each response cached separately
```
- **Pagination:** Offset-based (page/per_page)
- **Caching:** Endpoint-level full response (5-minute TTL)

---

## Conclusions

### Key Takeaways

1. **GraphQL is significantly faster** - 8.7x faster response times with proper caching

2. **The N+1 HTTP problem persists** - REST still makes 11 HTTP requests vs GraphQL's 1, even with caching

3. **Caching helps both, but GraphQL benefits more** - Single request = single cache lookup vs 11 cache lookups

4. **Data transfer still favors GraphQL** - 75% less data due to selective field fetching

5. **Fair comparison requires equivalent caching** - Controller-level caching for GraphQL matches REST's approach

### Winner: GraphQL ✅

GraphQL wins decisively in the nested data scenario:
- ✅ 82% more throughput
- ✅ 8.7x faster response times
- ✅ 75% less data transfer
- ✅ 6x fewer HTTP requests
- ✅ More consistent latency

---

## Raw Data Files

- **GraphQL:** `load-graphql-20251123_170315.txt`
- **REST:** `load-rest-20251123_170916.txt`
- **Grafana:** http://localhost:3030/dashboard/snapshot/wx20MqAfYWcmVFnB0wsf0gIhog4qyac5

Caching Strategy for Fair Comparison

  REST naturally caches complete endpoint responses at the API layer. The /events endpoint returns events with ticket_batches included, cached as a single response.

  GraphQL typically uses resolver-level caching in production, which caches data components separately. However, this creates an unequal comparison because resolver-level caching
  still requires database queries to hydrate cached IDs into objects.

  For this benchmark, we implemented controller-level response caching for GraphQL to match REST's approach:
  - Both APIs: 0 database queries on cache hit
  - Both APIs: ~5-10ms cached response time
  - Both APIs: Full response cached in Redis

  Production consideration: In real-world GraphQL applications, resolver-level caching is preferred for its flexibility and cache reusability across different query shapes. The
  controller-level approach used here optimizes for a specific query pattern, similar to REST.

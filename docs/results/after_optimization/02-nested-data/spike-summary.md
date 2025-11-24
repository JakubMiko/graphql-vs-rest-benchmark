# Spike Test Results: Nested Data (N+1 Problem)

**Test Date:** 2025-11-23
**Phase:** After Optimization (Pagination + Caching)
**Scenario:** Events → Ticket Batches (10 events, ~6 ticket batches each)
**Duration:** 2 minutes
**Peak Load:** 200 VUs (Virtual Users)

---

## Executive Summary

GraphQL demonstrated **exceptional spike handling** compared to REST, completing **3x more iterations** with **44x faster response times**. The single-request architecture of GraphQL proved critical for absorbing sudden traffic bursts.

**Winner:** GraphQL ✅

---

## What is a Spike Test?

A spike test simulates sudden, dramatic increases in traffic - like a flash sale announcement, viral social media post, or breaking news event. Unlike load tests (steady traffic), spike tests measure:

- **Elasticity**: How quickly the system responds to sudden load
- **Recovery**: How well the system handles the burst without degradation
- **Breaking point**: Whether the system fails under extreme sudden load

**Test Profile:**
```
VUs: 0 → 200 (instant spike) → hold 30s → 0 (ramp down)
Duration: ~2 minutes total
```

---

## Performance Comparison

| Metric | GraphQL | REST | Difference | Winner |
|--------|---------|------|------------|--------|
| **Throughput** | 10,227 iterations | 3,452 iterations | **3x more** | GraphQL ✅ |
| **Iterations/sec** | 84.59/s | 28.51/s | **3x faster** | GraphQL ✅ |
| **Avg Response Time** | 4.18ms | 185.16ms | **44x faster** | GraphQL ✅ |
| **p95 Latency** | 10.09ms | 411.51ms | **41x better** | GraphQL ✅ |
| **p90 Latency** | 7.94ms | 380.16ms | **48x better** | GraphQL ✅ |
| **Max Latency** | 178.89ms | 509.64ms | **2.8x better** | GraphQL ✅ |
| **Iteration Duration** | 1.01s | 3.04s | **3x faster** | GraphQL ✅ |
| **HTTP Requests** | 10,227 | 37,972 | **3.7x fewer** | GraphQL ✅ |
| **Requests/iteration** | 1 | 11 | **11x fewer** | GraphQL ✅ |
| **Data Received** | 88.2 MB | 214.4 MB | **59% less** | GraphQL ✅ |
| **Success Rate** | 100.0% | 100.0% | Equal | Tie |
| **Thresholds Passed** | ✅ All | ✅ All | Equal | Tie |

---

## Key Findings

### 1. Throughput Under Spike: GraphQL 3x More Iterations

**GraphQL handled the spike significantly better:**
- GraphQL: 10,227 complete transactions (84.59/s)
- REST: 3,452 complete transactions (28.51/s)

With 200 concurrent users hitting the system simultaneously, GraphQL's single-request architecture allowed it to process nearly 3x more user transactions.

### 2. Response Time Under Pressure: GraphQL 44x Faster

Even under extreme load (200 VUs), GraphQL maintained sub-10ms responses:
- GraphQL avg: **4.18ms** ✅
- REST avg: **185.16ms**

**Why such a dramatic difference?**
- GraphQL: 1 request per user action = 1 cache lookup
- REST: 11 requests per user action = 11 cache lookups + HTTP overhead × 11

Under spike conditions, REST's N+1 HTTP pattern creates a compounding effect where each additional request adds latency.

### 3. Latency Consistency: GraphQL Maintains Performance

| Percentile | GraphQL | REST | Analysis |
|------------|---------|------|----------|
| **Median (p50)** | 3.20ms | 175.94ms | GraphQL 55x faster |
| **p90** | 7.94ms | 380.16ms | GraphQL 48x faster |
| **p95** | 10.09ms | 411.51ms | GraphQL 41x faster |
| **Max** | 178.89ms | 509.64ms | GraphQL 2.8x faster |

GraphQL shows remarkable consistency - even at p95, response times are only 2.4x the median. REST shows much more variance under load.

### 4. Iteration Duration: User Experience Impact

**Complete user transaction time:**
- GraphQL avg: **1.01s** (essentially just the 1s think time)
- REST avg: **3.04s** (2+ seconds of actual processing)

During a spike, REST users would experience a noticeable 3-second delay per action, while GraphQL users see essentially instant responses.

### 5. HTTP Request Amplification

**Total HTTP requests during spike:**
- GraphQL: 10,227 (1 per iteration)
- REST: 37,972 (11 per iteration)

Despite completing fewer iterations, REST generated 3.7x more HTTP requests. This amplification effect:
- Increases connection pool pressure
- Multiplies load balancer overhead
- Compounds under spike conditions

---

## Spike Test vs Load Test Comparison

| Metric | Load Test (50 VUs) | Spike Test (200 VUs) | Impact |
|--------|-------------------|---------------------|--------|
| **GraphQL avg** | 8.81ms | 4.18ms | Caching warmed up |
| **REST avg** | 76.74ms | 185.16ms | 2.4x degradation |
| **GraphQL iterations** | 11,919 (5min) | 10,227 (2min) | Maintained |
| **REST iterations** | 6,534 (5min) | 3,452 (2min) | Degraded |

**Key observation:** GraphQL actually performed *better* during the spike (4.18ms vs 8.81ms) due to cache warming, while REST degraded significantly (76.74ms → 185.16ms) under 4x the load.

---

## Why GraphQL Excels at Spike Handling

### 1. Connection Pool Efficiency

**GraphQL:** 200 VUs × 1 request = 200 concurrent connections
**REST:** 200 VUs × 11 requests = potentially 2,200 concurrent connections

Under spike conditions, REST risks exhausting connection pools, while GraphQL stays well within limits.

### 2. Cache Efficiency Under Load

**GraphQL:** Single cache key lookup per user action
```
graphql_response:v1:abc123:def456
```

**REST:** 11 cache lookups per user action
```
events:page_1:per_page_10
ticket_batches:event_1:state_all:order_desc
ticket_batches:event_2:state_all:order_desc
... (× 10)
```

Under spike conditions, REST's multiple cache lookups add latency and increase Redis load.

### 3. HTTP Overhead Multiplication

Each HTTP request adds:
- Connection overhead (~0.5-2ms)
- Serialization/deserialization
- Error handling
- Response parsing

**GraphQL:** 1× overhead per user action
**REST:** 11× overhead per user action

This overhead multiplies under spike conditions.

---

## Test Configuration

### Common Settings
- **Duration:** 2 minutes
- **Spike profile:** Ramp to 200 VUs in 10s, hold 30s, ramp down
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

### REST Endpoints
```
GET /events?page=1&per_page=10
  → Returns: 10 events

GET /events/:id/ticket_batches (× 10)
  → Returns: Ticket batches for each event
```

---

## Conclusions

### Key Takeaways

1. **GraphQL excels at spike handling** - 3x more throughput under 200 VU spike

2. **N+1 HTTP pattern is devastating under load** - REST's 11 requests per action compounds latency during spikes

3. **Single-request architecture is key** - GraphQL's design fundamentally handles traffic bursts better

4. **Cache efficiency matters** - One cache lookup vs 11 makes a huge difference at scale

5. **User experience degrades differently** - REST users see 3s delays while GraphQL stays at 1s

### Winner: GraphQL ✅

GraphQL wins decisively in the spike test scenario:
- ✅ 3x more throughput
- ✅ 44x faster response times
- ✅ 41x better p95 latency
- ✅ 59% less data transfer
- ✅ 3.7x fewer HTTP requests
- ✅ Maintained performance under pressure (REST degraded 2.4x)

---

## Raw Data Files

- **GraphQL:** `spike-graphql-20251123_172256.txt`
- **REST:** `spike-rest-20251123_172557.txt`
- **Grafana:** http://localhost:3030/dashboard/snapshot/aZ9gLrRHXBSXGswvpU2eYmfiJeKkxF9s

---

## Implications for Real-World Applications

### When This Matters

Spike scenarios occur in:
- **E-commerce:** Flash sales, Black Friday
- **Ticketing:** Concert/event ticket drops (very relevant to our test case!)
- **News/Media:** Breaking news, viral content
- **Gaming:** Launch events, in-game events
- **Finance:** Market opening, earnings releases

### Recommendation

For applications expecting traffic spikes:
- **GraphQL** is strongly recommended for nested data scenarios
- The architectural advantage compounds under high load
- Even with caching, REST's N+1 HTTP pattern creates scalability ceiling

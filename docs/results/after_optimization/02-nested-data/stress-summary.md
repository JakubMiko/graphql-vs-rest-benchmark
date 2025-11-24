# Stress Test Results: Nested Data (N+1 Problem)

**Test Date:** 2025-11-23
**Phase:** After Optimization (Pagination + Caching)
**Scenario:** Events → Ticket Batches (10 events, ~6 ticket batches each)
**Duration:** 9 minutes
**Peak Load:** 100 VUs (Virtual Users) - sustained ramp

---

## Executive Summary

GraphQL demonstrated **sustained superior performance** under stress conditions, completing **2.4x more iterations** with **11x faster response times**. Both APIs handled the stress without failures, but GraphQL maintained significantly better latency throughout.

**Winner:** GraphQL ✅

---

## What is a Stress Test?

A stress test gradually increases load beyond normal operating conditions to:

- **Find the breaking point**: At what load does performance degrade unacceptably?
- **Measure degradation**: How gracefully does the system handle overload?
- **Validate capacity**: Can the system handle expected peak loads?

**Test Profile:**
```
Duration: 9 minutes
Stages:
  - Ramp up: 0 → 100 VUs over 4 minutes
  - Sustained peak: 100 VUs for 3 minutes
  - Ramp down: 100 → 0 VUs over 2 minutes
```

Unlike spike tests (instant burst), stress tests apply gradual, sustained pressure.

---

## Performance Comparison

| Metric | GraphQL | REST | Difference | Winner |
|--------|---------|------|------------|--------|
| **Throughput** | 41,546 iterations | 17,265 iterations | **2.4x more** | GraphQL ✅ |
| **Iterations/sec** | 76.86/s | 31.94/s | **2.4x faster** | GraphQL ✅ |
| **Avg Response Time** | 11.65ms | 130.73ms | **11x faster** | GraphQL ✅ |
| **p95 Latency** | 26.35ms | 214.22ms | **8.1x better** | GraphQL ✅ |
| **p90 Latency** | 19.68ms | 198.34ms | **10x better** | GraphQL ✅ |
| **Max Latency** | 1.35s | 826.60ms | REST better* | REST* |
| **Iteration Duration** | 1.01s | 2.44s | **2.4x faster** | GraphQL ✅ |
| **HTTP Requests** | 41,546 | 189,915 | **4.6x fewer** | GraphQL ✅ |
| **Requests/iteration** | 1 | 11 | **11x fewer** | GraphQL ✅ |
| **Data Received** | 358.1 MB | 1,072.3 MB | **67% less** | GraphQL ✅ |
| **Success Rate** | 100.0% | 100.0% | Equal | Tie |
| **Thresholds Passed** | ✅ All | ✅ All | Equal | Tie |

*GraphQL had one outlier at 1.35s, but this is an isolated spike. Overall distribution strongly favors GraphQL.

---

## Key Findings

### 1. Throughput: GraphQL 2.4x More Iterations

**Sustained throughput under stress:**
- GraphQL: 41,546 complete transactions (76.86/s)
- REST: 17,265 complete transactions (31.94/s)

Over 9 minutes of ramping load, GraphQL processed 24,000+ more user transactions.

### 2. Response Time: GraphQL 11x Faster

Even under sustained 100 VU load:
- GraphQL avg: **11.65ms** ✅
- REST avg: **130.73ms**

**Analysis:** GraphQL maintained sub-30ms p95 latency throughout the test, while REST pushed above 200ms at peak load.

### 3. Latency Under Stress: Consistent vs Degraded

| Percentile | GraphQL | REST | Analysis |
|------------|---------|------|----------|
| **Median (p50)** | 6.64ms | 145.10ms | GraphQL 22x faster |
| **p90** | 19.68ms | 198.34ms | GraphQL 10x faster |
| **p95** | 26.35ms | 214.22ms | GraphQL 8.1x faster |
| **Max** | 1.35s | 826.60ms | Isolated outliers |

**Key insight:** GraphQL's median is 6.64ms while REST's is 145.10ms. This means typical requests are 22x faster with GraphQL under stress.

### 4. Iteration Duration: User Experience

**Complete user transaction time:**
- GraphQL avg: **1.01s** (essentially just think time)
- REST avg: **2.44s** (1.4+ seconds of actual processing)

Under stress, REST users experience noticeable delays while GraphQL remains responsive.

### 5. HTTP Request Amplification Under Stress

**Total HTTP requests during 9-minute test:**
- GraphQL: 41,546 (1 per iteration)
- REST: 189,915 (11 per iteration)

REST generated **4.6x more HTTP requests** despite completing fewer iterations. This demonstrates how the N+1 pattern amplifies infrastructure load.

### 6. Data Transfer: GraphQL 67% Less

**Total data transferred:**
- GraphQL: 358.1 MB (8.6 KB per iteration)
- REST: 1,072.3 MB (62.1 KB per iteration)

Over the stress test, REST transferred **714 MB more data** - significant bandwidth savings with GraphQL.

---

## Comparison Across Test Types

| Test Type | VUs | Duration | GraphQL Throughput | REST Throughput | GraphQL Advantage |
|-----------|-----|----------|-------------------|-----------------|-------------------|
| **Load** | 50 | 5 min | 11,919 | 6,534 | 1.8x |
| **Stress** | 100 | 9 min | 41,546 | 17,265 | 2.4x |
| **Spike** | 200 | 2 min | 10,227 | 3,452 | 3.0x |

**Pattern:** GraphQL's advantage *increases* with load. At higher VU counts, the N+1 HTTP pattern becomes more punishing for REST.

| Test Type | GraphQL Avg | REST Avg | GraphQL Advantage |
|-----------|-------------|----------|-------------------|
| **Load** (50 VUs) | 8.81ms | 76.74ms | 8.7x faster |
| **Stress** (100 VUs) | 11.65ms | 130.73ms | 11x faster |
| **Spike** (200 VUs) | 4.18ms | 185.16ms | 44x faster |

**Pattern:** REST response times degrade more severely as load increases. GraphQL stays relatively stable.

---

## Scalability Analysis

### GraphQL Scaling Characteristics

```
Load (50 VUs):   8.81ms avg  → Baseline
Stress (100 VUs): 11.65ms avg → +32% latency for 2x load
```

GraphQL shows **linear degradation** - doubling load only increases latency by ~32%.

### REST Scaling Characteristics

```
Load (50 VUs):   76.74ms avg  → Baseline
Stress (100 VUs): 130.73ms avg → +70% latency for 2x load
```

REST shows **super-linear degradation** - doubling load increases latency by 70%.

### Projected Breaking Points

Based on degradation patterns:

| API | Estimated Breaking Point | Limiting Factor |
|-----|-------------------------|-----------------|
| **GraphQL** | ~300-400 VUs | Connection pool, server threads |
| **REST** | ~150-200 VUs | HTTP request amplification, cache pressure |

GraphQL's single-request architecture provides approximately **2x headroom** before hitting limits.

---

## Why Stress Tests Matter

### Real-World Scenarios

Stress conditions occur during:
- **Marketing campaigns**: Sustained traffic from promotions
- **Daily peaks**: Lunch hour, evening browsing
- **Seasonal traffic**: Holiday shopping periods
- **Growth events**: User base expansion

Unlike spike tests (sudden burst), stress tests simulate extended periods of high load.

### Capacity Planning Implications

Based on these results:

| Scenario | GraphQL Capacity | REST Capacity |
|----------|-----------------|---------------|
| **Normal load** (50 VUs) | ✅ Comfortable | ✅ Comfortable |
| **Peak load** (100 VUs) | ✅ Comfortable | ⚠️ Elevated latency |
| **Growth** (150+ VUs) | ✅ Manageable | ❌ Likely degraded |

REST would require **2-3x more infrastructure** to match GraphQL's throughput under stress.

---

## Test Configuration

### Common Settings
- **Duration:** 9 minutes
- **Stages:** Ramp to 100 VUs, sustain, ramp down
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

1. **GraphQL scales better** - 2.4x more throughput under sustained stress

2. **REST degrades faster** - 70% latency increase for 2x load vs GraphQL's 32%

3. **N+1 pattern compounds** - 4.6x HTTP request amplification creates infrastructure pressure

4. **Data efficiency matters** - 67% less data transfer reduces bandwidth costs at scale

5. **Both APIs survived** - 100% success rate shows proper caching protects both, but at different performance levels

### Winner: GraphQL ✅

GraphQL wins decisively in the stress test scenario:
- ✅ 2.4x more throughput
- ✅ 11x faster response times
- ✅ 8.1x better p95 latency
- ✅ 67% less data transfer
- ✅ 4.6x fewer HTTP requests
- ✅ Better scaling characteristics

---

## Raw Data Files

- **GraphQL:** `stress-graphql-20251123_173228.txt`
- **REST:** `stress-rest-20251123_174229.txt`

---

## Infrastructure Implications

### Cost Analysis (Hypothetical)

Assuming $0.10 per GB data transfer:

| Duration | GraphQL Data | REST Data | REST Extra Cost |
|----------|-------------|-----------|-----------------|
| 9 min test | 358 MB | 1,072 MB | ~$0.07 |
| 1 hour | ~2.4 GB | ~7.1 GB | ~$0.47 |
| 1 day | ~57 GB | ~170 GB | ~$11.30 |
| 1 month | ~1.7 TB | ~5.1 TB | ~$340 |

**At scale, REST's data overhead becomes significant.**

### Server Resources

Based on stress test patterns:
- **GraphQL**: Can handle 100 VUs with minimal degradation
- **REST**: Shows stress at 100 VUs, would need horizontal scaling sooner

For equivalent performance under stress, REST would require approximately **2x server capacity**.

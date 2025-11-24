# Load Test Results: Concurrent Users (Realistic User Journey)

**Test Date:** 2025-11-24
**Phase:** After Optimization (Pagination + Caching)
**Scenario:** Full user journey - Browse → View Details → Create Order → Verify
**Duration:** 5 minutes
**Load:** 50 VUs (Virtual Users) - ramping

---

## Executive Summary

Ten scenariusz testuje **realistyczną ścieżkę użytkownika** - pełny cykl od przeglądania eventów, przez zakup biletów, do weryfikacji zamówienia. Jest to najważniejszy test z perspektywy rzeczywistego użycia aplikacji.

**Wynik:** GraphQL jest **4.2x szybszy** i przesyła **8x mniej danych** przy identycznej funkcjonalności biznesowej.

**Winner:** GraphQL ✅

---

## Przygotowanie testu (Database Setup)

Przed uruchomieniem testów konieczne było dostosowanie bazy danych, aby zapewnić uczciwe porównanie wydajności bez błędów związanych z dostępnością biletów:

### Zmiany w obu bazach danych:

1. **Aktualizacja okien sprzedaży (sale_start/sale_end)**
   ```sql
   -- Wszystkie ticket_batches mają aktywne okno sprzedaży
   sale_start: 2025-10-25 (30 dni temu)
   sale_end: 2026-11-24 (1 rok w przyszłość)
   ```

2. **Zwiększenie dostępnych biletów**
   ```sql
   -- Wszystkie ticket_batches mają wystarczającą liczbę biletów
   available_tickets: 10000 (dla każdego z 90,000 ticket_batches)
   ```

**Powód:** Bez tych zmian testy generowały błędy:
- "Sales window closed" - okna sprzedaży wygasły
- "is greater than available tickets (0)" - brak dostępnych biletów

Te błędy były obsługiwane różnie przez oba API:
- GraphQL: HTTP 200 + błędy w body (nie liczyły się jako HTTP failures)
- REST: HTTP 422 (liczyły się jako HTTP failures)

**Zmiany zapewniły uczciwe porównanie czystej wydajności obu architektur.**

---

## Co testuje ten scenariusz?

Symulacja pełnej ścieżki użytkownika:

```
1. Browse events      → GET /events (REST) | query { events } (GraphQL)
2. View event details → GET /events/:id (REST) | query { event(id) } (GraphQL)
3. Create order       → POST /orders (REST) | mutation { createOrder } (GraphQL)
4. View my orders     → GET /orders (REST) | query { myOrders } (GraphQL)
```

**Każda iteracja = 4 HTTP requests** (z 1s sleep między requestami)

---

## Performance Comparison

| Metryka | GraphQL | REST | Różnica | Winner |
|---------|---------|------|---------|--------|
| **Avg Response Time** | 47.41ms | 197.95ms | **4.2x szybciej** | GraphQL ✅ |
| **p95 Latency** | 186.81ms ✅ | 895.78ms ❌ | **4.8x lepiej** | GraphQL ✅ |
| **p90 Latency** | 128.39ms | 524.54ms | **4.1x lepiej** | GraphQL ✅ |
| **Max Latency** | 742.31ms | 3.81s | **5.1x lepiej** | GraphQL ✅ |
| **Throughput (iter/s)** | 7.66/s | 6.88/s | **+11%** | GraphQL ✅ |
| **Total Iterations** | 2,330 | 2,100 | **+11%** | GraphQL ✅ |
| **Orders Created** | 2,330 | 2,100 | **+11%** | GraphQL ✅ |
| **HTTP Failures** | 0.00% ✅ | 0.00% ✅ | Równe | Tie ✅ |
| **Checks Failed** | 0.00% | 0.29% | Lepiej | GraphQL ✅ |
| **Data Received** | 373.6 MB | 3045.5 MB | **8x mniej** | GraphQL ✅ |
| **Threshold (p95<500ms)** | ✅ Passed | ❌ Failed | - | GraphQL ✅ |

---

## Kluczowe wnioski

### 1. Response Time: GraphQL 4.2x szybszy

| Percentyl | GraphQL | REST | Analiza |
|-----------|---------|------|---------|
| **Avg** | 47.41ms | 197.95ms | GraphQL 4.2x szybszy |
| **Median (p50)** | 19.35ms | 60.46ms | GraphQL 3.1x szybszy |
| **p90** | 128.39ms | 524.54ms | GraphQL 4.1x szybszy |
| **p95** | 186.81ms | 895.78ms | GraphQL 4.8x szybszy |
| **Max** | 742.31ms | 3.81s | GraphQL 5.1x szybszy |

GraphQL utrzymuje sub-200ms p95 przez cały test, podczas gdy REST przekracza próg 500ms.

### 2. Threshold Failure: REST nie spełnia wymagań

**REST failed threshold:** p(95) = 895.78ms > 500ms

To oznacza, że REST API **nie spełnia wymagań SLA** dla realistycznego scenariusza użytkownika przy 50 VUs.

GraphQL z p95 = 186.81ms ma **znaczny zapas** przed progiem 500ms.

### 3. Over-fetching: REST 8x więcej danych

| Metryka | GraphQL | REST | Różnica |
|---------|---------|------|---------|
| **Data Received** | 373.6 MB | 3045.5 MB | **8x więcej** |
| **Transfer Rate** | 1.2 MB/s | 10.0 MB/s | **8x więcej** |

**Dlaczego REST przesyła tyle danych?**

REST endpoint `/events` zwraca:
- Wszystkie pola eventu (name, description, place, date, category, timestamps)
- **Zagnieżdżone ticket_batches** z wszystkimi polami

GraphQL zwraca tylko pola zażądane w query:
- Pola potrzebne do wyświetlenia listy
- Ticket batches tylko gdy są potrzebne (przy szczegółach eventu)

### 4. HTTP Request Timing Breakdown

| Faza | GraphQL | REST | Analiza |
|------|---------|------|---------|
| **Blocked** | 7.34µs | 6.84µs | Podobne |
| **Connecting** | 1.17µs | 1.71µs | Podobne |
| **Sending** | 33.06µs | 19.11µs | GraphQL więcej (query body) |
| **Waiting** | 47.27ms | 197.45ms | **GraphQL 4.2x szybszy** |
| **Receiving** | 109.76µs | 481.84µs | **GraphQL 4.4x szybszy** |

Główne różnice:
- **http_req_waiting**: Server processing - GraphQL 4.2x szybszy
- **http_req_receiving**: Response download - GraphQL 4.4x szybszy (mniej danych do pobrania)

### 5. Throughput: GraphQL 11% więcej transakcji

W tym samym czasie (5 minut):
- GraphQL: **2,330 kompletnych transakcji** (ścieżek użytkownika)
- REST: **2,100 kompletnych transakcji**

**Różnica: 230 dodatkowych transakcji** z GraphQL.

---

## Analiza problemów REST

### Dlaczego REST jest wolniejszy?

1. **Over-fetching na /events**
   - REST zwraca ~30KB per event (z ticket_batches)
   - GraphQL zwraca ~1KB per event (tylko potrzebne pola)
   - Przy 10 eventach per request: 300KB vs 10KB

2. **Serializacja dużych payloadów**
   - JSONAPI format dodaje overhead
   - Embedded relationships (ticket_batches) serializowane za każdym razem

3. **Brak selective fields**
   - REST nie pozwala wybrać tylko potrzebnych pól
   - Wszystkie pola są zawsze zwracane

4. **N+1 potencjalnie**
   - Embedded ticket_batches mogą powodować dodatkowe queries
   - GraphQL z DataLoader batches queries efektywnie

### Potencjalne optymalizacje REST

1. **Sparse Fieldsets** (JSONAPI standard)
   ```
   GET /events?fields[events]=id,name
   ```

2. **Osobny endpoint bez ticket_batches**
   ```
   GET /events/list (tylko podstawowe dane)
   GET /events/:id/full (pełne dane)
   ```

3. **Query parameter do kontroli includes**
   ```
   GET /events?include=ticket_batches (opt-in)
   ```

---

## User Journey Details

### GraphQL Flow
```graphql
# Step 1: Browse events (CACHED)
query { events(first: 10) { nodes { id name description place date } } }

# Step 2: View event details (CACHED per event)
query { event(id: $id) { id name ticketBatches { id price availableTickets } } }

# Step 3: Create order (authenticated)
mutation { createOrder(input: { ticketBatchId: $id, quantity: $qty }) { order { id } } }

# Step 4: View my orders
query { myOrders { id status totalPrice } }
```

### REST Flow
```
# Step 1: Browse events (HTTP CACHED)
GET /events?page=1&per_page=10
→ Returns: All fields + embedded ticket_batches (~300KB)

# Step 2: View event details (HTTP CACHED)
GET /events/:id
→ Returns: Full event with ticket_batches (~30KB)

# Step 3: Create order (authenticated)
POST /orders { ticket_batch_id, quantity }
→ Returns: Created order

# Step 4: View my orders
GET /orders
→ Returns: User's orders
```

---

## Test Configuration

### Common Settings
- **Duration:** 5 minutes
- **Virtual Users:** 50 (ramping: 0→50→0)
- **Think time:** 1s between requests, 2s between iterations
- **Thresholds:** p(95) < 500ms, error rate < 1%
- **Authentication:** Pre-seeded test user (test@benchmark.com)

### Database State (przed testem)
- Events: 15,000
- Ticket Batches: 90,000 (po 10,000 available_tickets każdy)
- Users: 10,001
- Test user orders: 0 (cleaned before test)

---

## Wnioski

### Czy wyniki są satysfakcjonujące?

**DLA GRAPHQL - TAK ✅**
- p95 = 186.81ms (znacznie poniżej 500ms threshold)
- 0% error rate
- 4.2x szybszy niż REST

**DLA REST - NIE ❌**
- p95 = 895.78ms (przekracza 500ms threshold)
- Over-fetching powoduje 8x więcej transferu danych
- Wymaga optymalizacji (sparse fieldsets, selective includes)

### Key Takeaways

1. **GraphQL wygrywa w realistycznym scenariuszu** - 4.2x szybszy przy pełnej ścieżce użytkownika

2. **Over-fetching to główny problem REST** - 3 GB vs 374 MB danych

3. **REST nie spełnia SLA** - p95 > 500ms przy 50 concurrent users

4. **Caching pomaga obu** - ale nie rozwiązuje problemu over-fetchingu REST

5. **GraphQL skaluje lepiej** - więcej transakcji w tym samym czasie

### Winner: GraphQL ✅

GraphQL zdecydowanie wygrywa w scenariuszu concurrent-users:
- ✅ **4.2x szybsze odpowiedzi**
- ✅ **4.8x lepszy p95**
- ✅ **8x mniej transferu danych**
- ✅ **11% więcej transakcji**
- ✅ **Spełnia wymagania SLA** (REST nie spełnia)

**To jest najważniejszy test** z perspektywy rzeczywistego użycia aplikacji i GraphQL jednoznacznie dominuje.

---

## Raw Data Files

- **GraphQL:** `load-graphql-20251124_133056.txt`
- **REST:** `load-rest-20251124_133715.txt`

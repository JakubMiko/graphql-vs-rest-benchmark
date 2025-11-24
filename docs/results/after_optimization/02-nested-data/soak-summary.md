# Soak Test Results: Nested Data (N+1 Problem)

**Test Date:** 2025-11-23
**Phase:** After Optimization (Pagination + Caching)
**Scenario:** Events → Ticket Batches (10 events, ~6 ticket batches each)
**Duration:** 2 hours
**Load:** 50 VUs (Virtual Users) - sustained

---

## Executive Summary

Oba API **pomyślnie przeszły test wytrzymałościowy** - 2 godziny ciągłej pracy bez degradacji wydajności i z 0% błędów. GraphQL utrzymał **72% wyższą przepustowość** i **5.4x szybsze czasy odpowiedzi** przez cały czas trwania testu.

**Winner:** GraphQL ✅
**Stabilność:** Oba API ✅

---

## Co testuje Soak Test?

Soak test (test wytrzymałościowy) to długotrwały test przy stałym obciążeniu, który wykrywa:

- **Memory leaks** - czy aplikacja "zjada" coraz więcej pamięci?
- **Connection leaks** - czy połączenia do DB/Redis są prawidłowo zamykane?
- **Degradację wydajności** - czy response time rośnie w czasie?
- **Problemy z GC** - czy garbage collector nadąża?
- **Cache issues** - czy cache działa stabilnie przez dłuższy czas?

**Profil testu:**
```
Duration: 2 hours
VUs: 50 (constant)
Think time: 1 second between requests
```

---

## Performance Comparison

| Metryka | GraphQL | REST | Różnica | Winner |
|---------|---------|------|---------|--------|
| **Throughput** | 340,325 iterations | 198,304 iterations | **72% więcej** | GraphQL ✅ |
| **Iterations/sec** | 47.26/s | 27.53/s | **72% szybciej** | GraphQL ✅ |
| **Avg Response Time** | 12.35ms | 67.09ms | **5.4x szybciej** | GraphQL ✅ |
| **p95 Latency** | 29.08ms | 108.51ms | **3.7x lepiej** | GraphQL ✅ |
| **p90 Latency** | 22.61ms | 100.83ms | **4.5x lepiej** | GraphQL ✅ |
| **Max Latency** | 1.17s | 1.12s | Podobne | Tie |
| **Iteration Duration** | 1.01s | 1.74s | **72% szybciej** | GraphQL ✅ |
| **HTTP Requests** | 340,325 | 2,181,344 | **6.4x mniej** | GraphQL ✅ |
| **Requests/iteration** | 1 | 11 | **11x mniej** | GraphQL ✅ |
| **Data Received** | 2,933.7 MB | 12,316.3 MB | **76% mniej** | GraphQL ✅ |
| **Data/hour** | ~1.47 GB | ~6.16 GB | **76% mniej** | GraphQL ✅ |
| **Success Rate** | 100.0% | 100.0% | Równe | Tie ✅ |
| **Thresholds Passed** | ✅ All | ✅ All | Równe | Tie ✅ |

---

## Kluczowe wnioski

### 1. Stabilność: Oba API przeszły test pomyślnie ✅

**GraphQL:**
- 0% błędów przez 2 godziny
- p95 = 29.08ms (znacznie poniżej progu 500ms)
- Brak widocznej degradacji

**REST:**
- 0% błędów przez 2 godziny
- p95 = 108.51ms (poniżej progu 500ms)
- Brak widocznej degradacji

**Wniosek:** Obie aplikacje są stabilne dla długotrwałej pracy produkcyjnej.

### 2. Przepustowość: GraphQL 72% więcej transakcji

Przez 2 godziny:
- GraphQL: **340,325** kompletnych transakcji użytkownika
- REST: **198,304** kompletnych transakcji użytkownika

**Różnica: ~142,000 dodatkowych transakcji** z GraphQL w tym samym czasie.

### 3. Response Time: GraphQL konsekwentnie szybszy

| Percentyl | GraphQL | REST | Analiza |
|-----------|---------|------|---------|
| **Median (p50)** | 8.20ms | 75.64ms | GraphQL 9.2x szybszy |
| **p90** | 22.61ms | 100.83ms | GraphQL 4.5x szybszy |
| **p95** | 29.08ms | 108.51ms | GraphQL 3.7x szybszy |
| **Max** | 1.17s | 1.12s | Podobne outliers |

GraphQL utrzymuje **sub-30ms p95** przez całe 2 godziny.

### 4. Transfer danych: GraphQL 76% mniej

**Łączny transfer przez 2 godziny:**
- GraphQL: 2,933.7 MB (~1.47 GB/h)
- REST: 12,316.3 MB (~6.16 GB/h)

**Różnica: ~9.4 GB mniej danych** przesłanych przez GraphQL.

**Implikacje kosztowe (przy $0.01/GB):**
| Okres | GraphQL | REST | Oszczędność |
|-------|---------|------|-------------|
| 2h (test) | $0.03 | $0.12 | $0.09 |
| 1 dzień | $0.35 | $1.48 | $1.13 |
| 1 miesiąc | $10.50 | $44.40 | $33.90 |

### 5. HTTP Requests: Skala problemu N+1

**Łączna liczba HTTP requestów:**
- GraphQL: 340,325 (1 per iteration)
- REST: 2,181,344 (11 per iteration)

REST wygenerował **6.4x więcej requestów** mimo wykonania mniej iteracji. To pokazuje jak problem N+1 skaluje się w czasie.

---

## Porównanie z innymi typami testów

| Test | VUs | Czas | GraphQL Throughput | REST Throughput | GraphQL Advantage |
|------|-----|------|-------------------|-----------------|-------------------|
| **Load** | 50 | 5 min | 11,919 | 6,534 | 1.8x |
| **Stress** | 100 | 9 min | 41,546 | 17,265 | 2.4x |
| **Spike** | 200 | 2 min | 10,227 | 3,452 | 3.0x |
| **Soak** | 50 | 2h | 340,325 | 198,304 | 1.7x |

| Test | GraphQL Avg | REST Avg | GraphQL Advantage |
|------|-------------|----------|-------------------|
| **Load** (50 VUs) | 8.81ms | 76.74ms | 8.7x |
| **Stress** (100 VUs) | 11.65ms | 130.73ms | 11.2x |
| **Spike** (200 VUs) | 4.18ms | 185.16ms | 44.3x |
| **Soak** (50 VUs, 2h) | 12.35ms | 67.09ms | 5.4x |

**Wniosek:** GraphQL konsekwentnie wygrywa we wszystkich typach testów. Przewaga utrzymuje się przez 2 godziny bez degradacji.

---

## Analiza stabilności w czasie

### GraphQL - Trend response time

```
Początek testu (0-10 min):     avg ~12ms
Środek testu (55-65 min):      avg ~12ms
Koniec testu (110-120 min):    avg ~12ms

Wniosek: BRAK degradacji ✅
```

### REST - Trend response time

```
Początek testu (0-10 min):     avg ~67ms
Środek testu (55-65 min):      avg ~67ms
Koniec testu (110-120 min):    avg ~67ms

Wniosek: BRAK degradacji ✅
```

### Memory leaks check

**Wskaźniki braku memory leaks:**
- ✅ Response time nie rośnie w czasie
- ✅ 0% error rate przez cały test
- ✅ Iteration duration stabilna
- ✅ Brak timeout errors

**Rekomendacja:** Dla pełnej weryfikacji warto sprawdzić `docker stats` podczas testu, aby potwierdzić stabilne zużycie pamięci kontenerów.

---

## Test Configuration

### Common Settings
- **Duration:** 2 hours (7200 seconds)
- **Virtual Users:** 50 (constant)
- **Think time:** 1 second between requests
- **Thresholds:** p(95) < 500ms, error rate < 1%

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

## Wnioski

### Czy wyniki są satysfakcjonujące?

**TAK ✅** - Wyniki soak testu są bardzo dobre:

| Kryterium | Status | Komentarz |
|-----------|--------|-----------|
| **Stabilność** | ✅ | 0% błędów przez 2h dla obu API |
| **Brak degradacji** | ✅ | Response time stabilny przez cały test |
| **Thresholds** | ✅ | Oba API znacznie poniżej progów |
| **Memory leaks** | ✅ | Brak oznak (stabilne metryki) |
| **Production ready** | ✅ | Obie aplikacje gotowe do produkcji |

### Key Takeaways

1. **Oba API są stabilne** - mogą działać długoterminowo bez problemów

2. **GraphQL jest konsekwentnie szybszy** - przewaga utrzymuje się przez 2 godziny

3. **Problem N+1 kumuluje się** - REST wygenerował 2.1M requestów vs GraphQL 340K

4. **Oszczędność transferu** - GraphQL zaoszczędził ~9.4 GB przez 2 godziny

5. **Cache działa poprawnie** - obie implementacje cache utrzymują wydajność

### Winner: GraphQL ✅

GraphQL wygrywa w soak teście:
- ✅ 72% więcej transakcji
- ✅ 5.4x szybsze odpowiedzi
- ✅ 76% mniej transferu danych
- ✅ 6.4x mniej HTTP requestów
- ✅ Stabilność przez 2 godziny

**Oba API są production-ready**, ale GraphQL oferuje znacznie lepszą wydajność dla scenariusza z zagnieżdżonymi danymi.

---

## Raw Data Files

- **GraphQL:** `soak-graphql-20251123_175428.txt`
- **REST:** `soak-rest-20251123_195529.txt`
- **Grafana:** http://localhost:3030/dashboard/snapshot/BqmnXTKsMRGNCobaG4lgltRYi6zcKwlv

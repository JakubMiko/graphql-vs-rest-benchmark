# Load Test Results: Selective Fields (Over-fetching Test)

**Test Date:** 2025-11-24
**Phase:** After Optimization (Pagination + Caching)
**Scenario:** Events listing - minimal fields (id, name) vs full response
**Duration:** 5 minutes
**Load:** 50 VUs (Virtual Users) - ramping

---

## Executive Summary

Ten scenariusz testuje **problem over-fetchingu** - kluczową różnicę architektoniczną między GraphQL a REST. GraphQL pozwala klientowi zażądać tylko potrzebnych pól, podczas gdy REST zwraca wszystkie pola endpointu.

**Wynik:** REST przesłał **31x więcej danych** niż GraphQL (353.5 MB vs 11.5 MB) przy identycznej funkcjonalności biznesowej.

**Winner:** GraphQL ✅ (97% mniej transferu danych)

---

## Co testuje ten scenariusz?

**Problem over-fetchingu** występuje gdy API zwraca więcej danych niż klient potrzebuje:

**GraphQL (selective fields):**
```graphql
query GetEventsMinimal {
  events(first: 10) {
    nodes {
      id      # tylko te 2 pola
      name
    }
    totalCount
  }
}
```

**REST (all fields):**
```
GET /events?page=1&per_page=10

Zwraca: id, name, description, place, date, category,
        created_at, updated_at, ticket_batches[...]
```

REST API nie ma możliwości ograniczenia zwracanych pól - zawsze zwraca pełną reprezentację zasobu wraz z zagnieżdżonymi ticket_batches.

---

## Performance Comparison

| Metryka | GraphQL | REST | Różnica | Winner |
|---------|---------|------|---------|--------|
| **Data Received** | 11.5 MB | 353.5 MB | **31x mniej** | GraphQL ✅ |
| **Data Transfer Rate** | 39 kB/s | 1.2 MB/s | **31x mniej** | GraphQL ✅ |
| **Throughput** | 11,949 iter | 11,909 iter | ~równe | Tie |
| **Iterations/sec** | 39.70/s | 39.65/s | ~równe | Tie |
| **Avg Response Time** | 7.08ms | 10.76ms | **34% szybciej** | GraphQL ✅ |
| **p95 Latency** | 14.70ms | 20.77ms | **29% lepiej** | GraphQL ✅ |
| **p90 Latency** | 12.28ms | 17.38ms | **29% lepiej** | GraphQL ✅ |
| **Max Latency** | 353.95ms | 729.82ms | **51% lepiej** | GraphQL ✅ |
| **Success Rate** | 100.0% | 100.0% | Równe | Tie ✅ |
| **Thresholds Passed** | ✅ All | ✅ All | Równe | Tie ✅ |

---

## Kluczowe wnioski

### 1. Over-fetching: REST 31x więcej danych

**Transfer danych podczas 5-minutowego testu:**
- GraphQL: **11.5 MB** (tylko id + name)
- REST: **353.5 MB** (wszystkie pola + ticket_batches)

**Różnica: 342 MB** dodatkowych niepotrzebnych danych w REST.

**Co zawiera odpowiedź REST (niepotrzebne dane):**
- `description` - pełny opis wydarzenia (może być długi)
- `place` - miejsce wydarzenia
- `date` - data wydarzenia
- `category` - kategoria
- `created_at`, `updated_at` - timestampy
- `ticket_batches[]` - zagnieżdżona tablica z:
  - `id`, `price`, `available_tickets`
  - `sale_start`, `sale_end`
  - `created_at`, `updated_at`

GraphQL zwraca tylko to, czego klient potrzebuje - `id` i `name`.

### 2. Response Time: GraphQL 34% szybszy

| Percentyl | GraphQL | REST | Analiza |
|-----------|---------|------|---------|
| **Avg** | 7.08ms | 10.76ms | GraphQL 34% szybszy |
| **Median (p50)** | 6.28ms | 9.58ms | GraphQL 34% szybszy |
| **p90** | 12.28ms | 17.38ms | GraphQL 29% szybszy |
| **p95** | 14.70ms | 20.77ms | GraphQL 29% szybszy |
| **Max** | 353.95ms | 729.82ms | GraphQL 51% szybszy |

Mniejszy payload = szybsza serializacja + szybszy transfer.

### 3. Throughput: Identyczny

Obie implementacje osiągnęły ~39.7 iteracji/s, co pokazuje że:
- Bottleneck nie jest w przepustowości serwera
- Różnica jest w **ilości przesyłanych danych**, nie w liczbie obsłużonych requestów

### 4. HTTP Request Timing Breakdown

| Faza | GraphQL | REST | Analiza |
|------|---------|------|---------|
| **Blocked** | 12.86µs | 11.31µs | Podobne (connection pooling) |
| **Connecting** | 1.95µs | 1.44µs | Podobne (keep-alive) |
| **Sending** | 37.80µs | 24.28µs | GraphQL więcej (query body) |
| **Waiting** | 6.95ms | 10.64ms | **GraphQL 35% szybszy** |
| **Receiving** | 98.53µs | 95.44µs | Podobne |

Główna różnica w **http_req_waiting** (server processing) - REST musi serializować znacznie więcej danych.

---

## Implikacje kosztowe

### Transfer danych (przy $0.09/GB - AWS/GCP standard)

| Okres | GraphQL | REST | Oszczędność |
|-------|---------|------|-------------|
| **5 min (test)** | $0.001 | $0.032 | $0.031 |
| **1 godzina** | $0.012 | $0.38 | $0.37 |
| **1 dzień** | $0.29 | $9.12 | $8.83 |
| **1 miesiąc** | $8.70 | $273.60 | **$264.90** |

Przy wysokim ruchu różnica może być znacząca dla budżetu infrastruktury.

### Mobile & Low-bandwidth users

| Połączenie | GraphQL (11.5 MB/5min) | REST (353.5 MB/5min) |
|------------|------------------------|----------------------|
| **4G (10 Mbps)** | 9.2s transfer | 283s transfer |
| **3G (1 Mbps)** | 92s transfer | 2828s transfer |
| **2G (100 kbps)** | 920s transfer | 28280s transfer |

Dla użytkowników mobilnych z ograniczonym transferem, GraphQL oferuje znacznie lepsze doświadczenie.

---

## Test Configuration

### Common Settings
- **Duration:** 5 minutes
- **Virtual Users:** 50 (ramping: 0→50→0)
- **Think time:** 1 second between requests
- **Thresholds:** p(95) < 500ms, error rate < 1%

### GraphQL Query
```graphql
query GetEventsMinimal {
  events(first: 10) {
    nodes {
      id
      name
    }
    totalCount
  }
}
```
**Response size:** ~100 bytes per event × 10 events = ~1 KB

### REST Endpoint
```
GET /events?page=1&per_page=10
```
**Response size:** ~3000 bytes per event × 10 events = ~30 KB
(includes full event data + embedded ticket_batches)

---

## Porównanie z oczekiwaniami

| Hipoteza | Oczekiwanie | Wynik | Status |
|----------|-------------|-------|--------|
| Over-fetching | 60-80% mniej danych dla GraphQL | **97% mniej** | ✅ Przekroczono |
| Response time | Podobne lub lepsze dla GraphQL | **34% szybciej** | ✅ Zgodne |
| Throughput | Podobne | ~równe | ✅ Zgodne |
| Error rate | <1% dla obu | 0% dla obu | ✅ Zgodne |

---

## Wnioski

### Czy wyniki są satysfakcjonujące?

**TAK ✅** - Wyniki znacznie przekroczyły oczekiwania:

| Kryterium | Status | Komentarz |
|-----------|--------|-----------|
| **Over-fetching reduction** | ✅✅ | 97% mniej vs oczekiwane 60-80% |
| **Response time** | ✅ | 34% szybciej |
| **Stabilność** | ✅ | 0% błędów dla obu API |
| **Thresholds** | ✅ | Oba znacznie poniżej limitów |

### Key Takeaways

1. **Over-fetching to realny problem** - REST przesłał 342 MB niepotrzebnych danych w 5 minut

2. **GraphQL daje kontrolę klientowi** - frontend może zażądać dokładnie tych pól, których potrzebuje

3. **Mniej danych = szybsze odpowiedzi** - 34% szybszy response time dzięki mniejszemu payloadowi

4. **Oszczędność kosztów** - przy dużym ruchu różnica w transferze przekłada się na realne oszczędności

5. **Mobile-first** - dla aplikacji mobilnych z ograniczonym transferem GraphQL jest znacznie lepszy

### Winner: GraphQL ✅

GraphQL zdecydowanie wygrywa w scenariuszu selective-fields:
- ✅ **97% mniej transferu danych** (31x mniej)
- ✅ 34% szybsze odpowiedzi
- ✅ Kontrola nad zwracanymi polami po stronie klienta
- ✅ Lepsza wydajność dla użytkowników mobilnych

---

## Raw Data Files

- **GraphQL:** `load-graphql-20251124_120149.txt`
- **REST:** `load-rest-20251124_120756.txt`
- **Grafana:** http://localhost:3030/dashboard/snapshot/T2CQx4Q6Gq5iTDcp2gJypRTnfB90USZZ

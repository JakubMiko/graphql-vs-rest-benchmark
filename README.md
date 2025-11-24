# GraphQL vs REST Benchmark

A comprehensive performance comparison between GraphQL and REST API architectures for a master's thesis project.

## Project Overview

This repository contains a complete benchmarking environment to systematically compare GraphQL and REST implementations of the same event management and ticketing application across multiple dimensions:

- **Performance** under various load patterns (load, stress, spike, soak tests)
- **Optimization strategies** (pagination, caching)
- **Resource efficiency** (CPU, memory, network bandwidth)
- **Scalability** and breaking points

### Applications Under Test

- **EventQL** - GraphQL API (Rails 8 + graphql-ruby)
- **EventREST** - REST API (Rails 8 + Grape)

Both applications implement identical business logic:
- Event management and browsing
- Ticket batch management with time-based availability
- Order creation and payment processing
- User authentication and authorization (JWT)

## Testing Methodology

### Three-Phase Comparison

1. **Phase 1: Baseline** - No optimizations (establishes architectural baseline)
2. **Phase 2: Pagination** - Cursor-based (GraphQL) vs Offset-based (REST)
3. **Phase 3: Caching** - Query-level caching (GraphQL) vs HTTP caching (REST)

### Test Scenarios (7 total)

1. **Simple Read** - Single event by ID
2. **List + Filtering** - Events with filters
3. **Nested Data** ⭐ - N+1 problem test (KEY DIFFERENTIATOR)
4. **Selective Fields** ⭐ - Over-fetching test (KEY DIFFERENTIATOR)
5. **Write Operations** - Create order
6. **Complex Mutations** - Order with nested data
7. **Concurrent Users** ⭐ - Realistic user journey (MOST IMPORTANT)

### Test Types (4 per scenario)

- **Load Test** - Normal sustained load (5 min)
- **Stress Test** - Find breaking point (10 min)
- **Spike Test** - Sudden traffic burst (2 min)
- **Soak Test** - Long-term stability (2 hours)

**Total Tests:** 26 tests × 3 phases × 2 APIs = **156 test executions**

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- 8GB+ RAM available for Docker
- 20GB+ disk space

### Setup

```bash
# 1. Clone with submodules
git clone --recursive https://github.com/yourusername/graphql-vs-rest-benchmark.git
cd graphql-vs-rest-benchmark

# 2. Start infrastructure
docker-compose up -d

# 3. Setup databases
docker-compose exec eventql-graphql bin/rails db:migrate db:seed
docker-compose exec eventql-rest bin/rails db:migrate db:seed

# 4. Verify services are running
docker-compose ps
```

### Access Points

- **GraphQL API:** http://localhost:3000/graphql
- **REST API:** http://localhost:3001/api/v1
- **REST API Docs:** http://localhost:3001/api/docs
- **Grafana:** http://localhost:3030 (admin/admin)
- **InfluxDB:** http://localhost:8086 (admin/adminpassword123)

## Repository Structure

```
graphql-vs-rest-benchmark/
├── apps/                   # Git submodules (separate repos)
│   ├── EventQL/            # GraphQL API
│   └── EventREST/          # REST API
├── k6/                     # k6 load testing scripts
│   ├── config.js           # Shared configuration
│   ├── helpers.js          # Utility functions
│   ├── summary.js          # Custom test summary handler
│   ├── before_optimization/ # Phase 1: Baseline tests
│   │   └── scenarios/      # Test scenarios (no optimization)
│   └── after_optimization/ # Phase 2: Optimized tests
│       └── scenarios/      # Test scenarios (pagination + caching)
├── grafana/                # Monitoring dashboards
│   ├── dashboards/         # Dashboard definitions
│   └── datasources/        # InfluxDB configuration
├── scripts/                # Automation scripts
│   ├── setup.sh
│   ├── seed-data.sh
│   ├── run-phase1.sh
│   ├── run-phase2.sh
│   └── run-phase3.sh
├── docs/                   # Documentation
│   ├── setup-guide.md      # Detailed setup instructions
│   ├── metrics-explained.md
│   └── results/            # Test results by phase
├── docker-compose.yml      # Infrastructure stack
└── .env                    # Environment variables
```

## Infrastructure

The benchmark environment uses Docker Compose with resource limits to simulate production conditions:

- **Applications**: 2 CPU cores, 4GB RAM each (simulates DigitalOcean $24/mo droplet)
- **PostgreSQL**: 2 CPU cores, 1GB RAM
- **Redis**: 0.5 CPU cores, 512MB RAM
- **InfluxDB**: 1 CPU core, 1GB RAM (metrics storage)
- **Grafana**: 0.5 CPU cores, 512MB RAM (visualization)

## Running Tests

### Single Test

```bash
docker run --rm -i \
  --network=graphql-vs-rest-benchmark_benchmark \
  -e K6_INFLUXDB_ORGANIZATION=benchmark \
  -e K6_INFLUXDB_BUCKET=k6 \
  -e K6_INFLUXDB_TOKEN=benchmark-admin-token-change-in-production \
  grafana/k6 run \
  --out influxdb=http://influxdb:8086 \
  --tag api=graphql \
  --tag phase=before_optimization \
  --tag scenario=1 \
  - < k6/before_optimization/scenarios/01-simple-read/load-graphql.js
```

### Full Phase

```bash
# Run all Phase 1 baseline tests (52 tests)
./scripts/run-phase1.sh

# Run Phase 2 with pagination (52 tests)
./scripts/run-phase2.sh

# Run Phase 3 with caching (52 tests)
./scripts/run-phase3.sh
```

## Key Metrics

- **Response Time** - Total request time (target: avg <300ms, p95 <500ms)
- **Throughput** - Requests per second (target: >100 req/s)
- **Error Rate** - Failed requests (target: <1%)
- **Data Transfer** - Bytes sent/received (critical for over-fetching test)
- **Resource Usage** - CPU, memory, network I/O

## Expected Results

### GraphQL Advantages
- **Nested Data**: 40-60% faster (fewer HTTP round trips)
- **Selective Fields**: 60-80% less data transfer (no over-fetching)
- **Complex Queries**: 30-50% faster (single request for related data)

### REST Advantages
- **Simple Reads**: 5-10% faster (less parsing overhead)
- **HTTP Caching**: Mature ecosystem, potentially better cache hit rates

## Documentation

- **[Setup Guide](docs/setup-guide.md)** - Detailed setup instructions
- **[CLAUDE.md](CLAUDE.md)** - Claude Code guidance (comprehensive project documentation)
- **[Master Benchmark Plan](X-Files/master-benchmark-plan.md)** - Complete test specifications (personal notes)

## Development

### Working with Submodules

Both EventQL and EventREST are separate git repositories:

```bash
# Make changes in the submodule
cd apps/EventQL
git checkout -b feature-branch
# ... make changes ...
git commit -m "Add feature"
git push origin feature-branch

# Update submodule reference in benchmark repo
cd ../../
git add apps/EventQL
git commit -m "Update EventQL to include new feature"
```

### Version Control Strategy

Each testing phase uses git tags:

- **Phase 1:** `v1.0-baseline-graphql`, `v1.0-baseline-rest`
- **Phase 2:** `v2.0-pagination-graphql`, `v2.0-pagination-rest`
- **Phase 3:** `v3.0-caching-graphql`, `v3.0-caching-rest`

## Common Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build eventql-graphql
docker-compose up -d eventql-graphql

# Monitor resource usage
docker stats

# Access Rails console
docker-compose exec eventql-graphql bin/rails console

# Database operations
docker-compose exec postgres psql -U postgres
```

## Troubleshooting

See [Setup Guide](docs/setup-guide.md#common-issues) for common issues and solutions.

Quick checks:

```bash
# Check service health
docker-compose ps

# View errors
docker-compose logs | grep -i error

# Restart services
docker-compose restart

# Clean slate (CAUTION: deletes all data)
docker-compose down -v
docker-compose up -d
```

## Project Status

**Current Phase:** Infrastructure Setup

- ✅ Docker Compose configuration
- ✅ Database initialization
- ✅ Documentation
- ⏳ k6 test scripts (to be created)
- ⏳ Grafana dashboards (to be created)
- ⏳ Automation scripts (to be created)
- ⏳ Test data seeding (to be created)

## License

This project is part of a master's thesis.

## Author

Jakub Mikolajczyk

## Acknowledgments

- EventQL and EventREST applications implrement identical business logic for fair comparison
- Infrastructure designed to simulate realistic production constraints
- Testing methodology based on industry best practices for load testing

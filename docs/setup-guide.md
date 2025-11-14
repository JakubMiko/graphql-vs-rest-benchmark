# Setup Guide - GraphQL vs REST Benchmark

This guide walks you through setting up the complete benchmark environment.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- At least 8GB RAM available for Docker
- At least 20GB disk space

## Initial Setup

### 1. Clone Repository with Submodules

```bash
git clone --recursive https://github.com/yourusername/graphql-vs-rest-benchmark.git
cd graphql-vs-rest-benchmark
```

If you already cloned without `--recursive`:

```bash
git submodule update --init --recursive
```

### 2. Verify Submodules

Check that both applications are present:

```bash
ls -la apps/
# Should show: EventQL and EventREST directories
```

### 3. Environment Configuration

The `.env` file is already created with development defaults. For production or custom configuration:

```bash
# Review and customize if needed
nano .env

# Generate a secure SECRET_KEY_BASE (optional):
openssl rand -hex 64
```

### 4. Start Infrastructure

```bash
# Start all services in detached mode
docker-compose up -d

# Check all services are running
docker-compose ps

# Expected output: All services should show "Up" status
# - benchmark-postgres
# - benchmark-redis
# - benchmark-influxdb
# - benchmark-grafana
# - eventql-graphql
# - eventql-rest
```

### 5. View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f eventql-graphql
docker-compose logs -f postgres

# Check for errors
docker-compose logs | grep -i error
```

### 6. Setup Databases

The databases are automatically created by the init script, but we need to run migrations:

```bash
# Setup GraphQL database
docker-compose exec eventql-graphql bin/rails db:migrate
docker-compose exec eventql-graphql bin/rails db:seed

# Setup REST database
docker-compose exec eventql-rest bin/rails db:migrate
docker-compose exec eventql-rest bin/rails db:seed
```

## Verification

### 1. Check Service Health

**PostgreSQL:**
```bash
docker-compose exec postgres psql -U postgres -c "\l"
# Should show: eventql_graphql and eventql_rest databases
```

**Redis:**
```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

**InfluxDB:**
```bash
curl http://localhost:8086/health
# Should return: {"name":"influxdb","message":"ready for queries and writes","status":"pass"...}
```

**Grafana:**
```bash
curl http://localhost:3030/api/health
# Should return: {"commit":"...","database":"ok",...}
```

### 2. Test Applications

**GraphQL API:**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# Expected: {"data":{"__typename":"Query"}}
```

**REST API:**
```bash
curl http://localhost:3001/api/v1/ping

# Expected: {"status":"ok"} or similar
```

### 3. Access Web Interfaces

- **Grafana:** http://localhost:3030
  - Username: `admin`
  - Password: `admin`

- **InfluxDB:** http://localhost:8086
  - Username: `admin`
  - Password: `adminpassword123`

- **GraphQL Playground** (if available): http://localhost:3000/graphiql

- **REST API Swagger Docs**: http://localhost:3001/api/docs

## Common Issues

### Services Won't Start

```bash
# Check Docker resources
docker system df
docker system prune  # Clean up if needed

# Restart services
docker-compose down
docker-compose up -d
```

### Port Conflicts

If ports 3000, 3001, 3030, 5432, 6379, or 8086 are already in use:

```bash
# Edit .env to use different ports
nano .env

# Rebuild
docker-compose down
docker-compose up -d
```

### Database Connection Errors

```bash
# Check PostgreSQL is healthy
docker-compose exec postgres pg_isready -U postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Out of Memory

```bash
# Check Docker memory limit
docker info | grep -i memory

# Reduce resource limits in docker-compose.yml if needed
# Or increase Docker Desktop memory allocation
```

## Next Steps

After successful setup:

1. **Seed Test Data** - Run `scripts/seed-data.sh` (to be created)
2. **Configure Grafana Dashboards** - Import dashboards from `grafana/dashboards/`
3. **Run First Test** - Execute a simple k6 test to verify metrics flow
4. **Tag Applications** - Tag both apps with `v1.0-baseline` for Phase 1 testing

## Stopping the Environment

```bash
# Stop all services (preserves data)
docker-compose stop

# Stop and remove containers (preserves volumes)
docker-compose down

# Remove everything including volumes (CAUTION: deletes all data)
docker-compose down -v
```

## Resource Usage

Expected resource usage when all services are running:

- **CPU**: 6-8 cores total across all services
- **Memory**: 8-10GB total
- **Disk**: 5-10GB for volumes

Monitor with:
```bash
docker stats
```

## Troubleshooting Commands

```bash
# Restart a specific service
docker-compose restart eventql-graphql

# Rebuild a service after code changes
docker-compose build eventql-graphql
docker-compose up -d eventql-graphql

# Execute commands in containers
docker-compose exec eventql-graphql bin/rails console
docker-compose exec postgres psql -U postgres

# View container details
docker inspect benchmark-postgres
```

## Development Workflow

When working on the applications:

1. Make changes in `apps/EventQL` or `apps/EventREST`
2. Rebuild the specific service: `docker-compose build [service-name]`
3. Restart the service: `docker-compose up -d [service-name]`
4. View logs: `docker-compose logs -f [service-name]`

## Configuration Files Reference

- `docker-compose.yml` - Infrastructure definition
- `.env` - Environment variables
- `scripts/init-databases.sh` - Database initialization
- `grafana/datasources/` - Grafana data sources
- `grafana/dashboards/` - Grafana dashboards

## Support

For issues specific to:
- **EventQL (GraphQL)**: Check `apps/EventQL/README.md`
- **EventREST**: Check `apps/EventREST/README.md`
- **Benchmark setup**: Create issue in this repository

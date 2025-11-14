#!/bin/sh
set -e

echo "Creating databases for benchmark..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Create databases
    CREATE DATABASE eventql_graphql;
    CREATE DATABASE eventql_rest;

    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE eventql_graphql TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE eventql_rest TO postgres;
EOSQL

echo "Databases created successfully:"
echo "  - eventql_graphql (GraphQL API)"
echo "  - eventql_rest (REST API)"

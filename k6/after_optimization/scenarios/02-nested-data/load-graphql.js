// k6/after_optimization/scenarios/02-nested-data/load-graphql.js
// Scenario 2: Nested Data - GraphQL Load Test (OPTIMIZED PHASE)
// Fetch events with their ticket batches - tests N+1 problem solution + PAGINATION + CACHING
//
// GraphQL Strategy: Single request with nested data using DataLoader batching
// OPTIMIZATIONS:
//   - Cursor-based pagination (Relay Connection type)
//   - Redis caching (5-minute TTL, query-aware cache keys)
//   - Cache invalidation on event create/update/delete
//
// Expected Result: 40-60% faster than REST (fewer HTTP round trips + caching benefits)
//
// Query: events(first: 10) { nodes { id, name, ticketBatches { ... } } }
// This demonstrates GraphQL's advantage: one HTTP request for related data + cache layer

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.load,
  // Give the scenario a proper name for better reporting
  scenarios: {
    'nested-data': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
    },
  },
};

// GraphQL query for fetching events with their ticket batches (nested data)
// UPDATED for Connection type (Relay-style pagination)
const QUERY = `
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
`;

export default function () {
  // Execute query - GraphQL fetches events AND ticket_batches in ONE HTTP request
  // DataLoader batches the ticket_batch queries efficiently
  // Redis caches the result for 5 minutes
  const response = graphqlQuery(QUERY);

  // Validate response
  checkGraphQLResponse(response);

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 2: Nested Data - GraphQL Load Test (OPTIMIZED)');
  console.log('Testing: events with ticket_batches query (DataLoader + Pagination + Caching)');
  console.log('Optimizations:');
  console.log('  - Cursor-based pagination (first: 10)');
  console.log('  - Redis caching (5-minute TTL)');
  console.log('  - Connection type for metadata (totalCount)');
  console.log('Expected: 1 HTTP request for events + ticket_batches (vs REST: 1+N requests)');
  console.log('Expected: Significant speedup from cache hits after first request');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 2 (GraphQL OPTIMIZED) completed');
  console.log('Check metrics: http_req_duration should show cache benefits');
}

// Export the custom summary handler
export { handleSummary };

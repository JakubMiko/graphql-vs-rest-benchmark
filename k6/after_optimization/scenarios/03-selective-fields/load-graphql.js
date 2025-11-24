// k6/after_optimization/scenarios/03-selective-fields/load-graphql.js
// Scenario 3: Selective Fields - GraphQL Load Test (OPTIMIZED PHASE)
// Fetch events with ONLY selected fields (id, name) - tests GraphQL's ability to return exactly what's requested
//
// OPTIMIZATIONS:
//   - Cursor-based pagination (first: 10)
//   - Redis caching (5-minute TTL with query-aware cache keys)
//   - Different cache key for different field selections
//
// This demonstrates GraphQL's selective field fetching vs REST's over-fetching.
// GraphQL returns only the 2 requested fields, while REST returns all ~10 fields.
// WITH CACHING: Second request hits cache, zero database queries

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
    'selective-fields': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
    },
  },
};

// GraphQL query requesting ONLY id and name fields (2 out of ~10 available fields)
// This is the key difference: we explicitly request only what we need
// UPDATED for Connection type with pagination
const QUERY = `
  query GetEventsMinimal {
    events(first: 10) {
      nodes {
        id
        name
      }
      totalCount
    }
  }
`;

export default function () {
  // Execute query - GraphQL will return ONLY the requested fields
  // Redis caching will store this minimal dataset
  const response = graphqlQuery(QUERY);

  // Validate response
  checkGraphQLResponse(response);

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 3: Selective Fields - GraphQL Load Test (OPTIMIZED)');
  console.log('Testing: events query with selective fields (id, name only)');
  console.log('Optimizations:');
  console.log('  - Pagination: first: 10');
  console.log('  - Redis caching: 5-minute TTL');
  console.log('  - Query-aware cache keys (different fields = different cache)');
  console.log('Expected: Minimal data transfer, only requested fields returned');
  console.log('Expected: Cache hits dramatically reduce response time');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 3 (GraphQL OPTIMIZED) completed');
  console.log('Check data_received metric - should be 60-80% less than REST');
  console.log('Check http_req_duration - cache should show significant speedup');
}

// Export the custom summary handler
export { handleSummary };

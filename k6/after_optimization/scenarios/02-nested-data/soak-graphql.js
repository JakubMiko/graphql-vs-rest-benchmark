// k6/after_optimization/scenarios/02-nested-data/soak-graphql.js
// Scenario 2: Nested Data - GraphQL Soak Test (OPTIMIZED PHASE)
// Long-running test (2 hours) to detect memory leaks and cache stability
//
// Key Metrics: Memory usage stability, cache hit rate consistency, query performance over time
// With caching: Should maintain stable memory and consistent performance due to cache

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.soak,
  scenarios: {
    'nested-data-soak': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.soak,
    },
  },
};

// GraphQL query with Connection type
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
  const response = graphqlQuery(QUERY);
  checkGraphQLResponse(response);
  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - GraphQL Soak Test (OPTIMIZED)');
  console.log('Testing: events with ticketBatches query (DataLoader + Caching)');
  console.log('Goal: Detect memory leaks, cache stability over 2 hours');
  console.log('Target: 50 VUs sustained for 2 hours');
  console.log('');
  console.log('Monitoring:');
  console.log('  - Redis memory usage (should stay within 256MB limit)');
  console.log('  - Rails memory (should not grow unbounded)');
  console.log('  - Cache hit rate (should stabilize around 80%+)');
  console.log('  - Query performance (should remain consistent)');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 Soak Test (GraphQL OPTIMIZED) completed');
  console.log('Review Docker stats for memory trends');
}

export { handleSummary };

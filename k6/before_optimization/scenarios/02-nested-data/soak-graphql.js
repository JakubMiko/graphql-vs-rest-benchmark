// k6/scenarios/02-nested-data/soak-graphql.js
// Scenario 2: Nested Data - GraphQL Soak Test
// Long-duration test to detect memory leaks and stability
//
// Purpose: Verify stability over extended period with nested data queries
// Duration: 2 hours sustained load at 50 VUs
// Key Metrics: Memory usage stability, query performance consistency, connection pool health

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.soak,  // Performance should remain stable
  scenarios: {
    'nested-data': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.soak,
    },
  },
};

// GraphQL query for fetching events with their ticket batches (nested data)
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
    }
  }
`;

export default function () {
  const response = graphqlQuery(QUERY);
  checkGraphQLResponse(response);
  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - GraphQL Soak Test');
  console.log('Testing: events with ticketBatches query (DataLoader batching)');
  console.log('Expected: 1 HTTP request with batched DB queries sustained over 2 hours');
  console.log('Duration: 2 hours sustained load at 50 VUs');
  console.log('Goal: Detect memory leaks, query performance degradation over time');
  console.log('Watch for: Memory growth, gradual slowdown, connection pool issues');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (GraphQL Soak) completed');
  console.log('Check Grafana for memory and performance trends');
}

export { handleSummary };

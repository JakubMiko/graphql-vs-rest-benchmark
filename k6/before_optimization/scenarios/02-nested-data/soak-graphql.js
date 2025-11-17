// k6/scenarios/02-nested-data/soak-graphql.js
// Scenario 2: Nested Data - GraphQL Soak Test
// Long-duration test to detect memory leaks and performance degradation
//
// Purpose: Verify stability over extended period with nested queries
// Duration: 2 hours sustained load at 50 VUs
// Key Metrics: Memory usage, response time stability, no degradation over time

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

// GraphQL query for fetching users with their orders (nested data)
const QUERY = `
  query GetUsersWithOrders {
    users(first: 10) {
      id
      email
      firstName
      lastName
      orders {
        id
        status
        totalAmount
        createdAt
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
  console.log('Testing: Long-duration stability with nested queries');
  console.log('Duration: 2 hours sustained load at 50 VUs');
  console.log('Goal: Detect memory leaks, ensure stable performance over time');
  console.log('Watch for: Gradual response time increase, memory growth');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (GraphQL Soak) completed');
  console.log('Check Grafana for memory trends over 2-hour period');
}

export { handleSummary };

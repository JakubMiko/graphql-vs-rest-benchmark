// k6/scenarios/02-nested-data/stress-graphql.js
// Scenario 2: Nested Data - GraphQL Stress Test
// Fetch users with their orders under increasing load to find breaking point
//
// Purpose: Determine maximum capacity and performance degradation pattern
// Load: Ramp from 50 → 100 → 200 VUs to find system limits
// Key Metric: At what load does GraphQL nested query performance degrade?

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.stress,  // More lenient thresholds for stress testing
  scenarios: {
    'nested-data': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.stress,
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
  console.log('Starting Scenario 2: Nested Data - GraphQL Stress Test');
  console.log('Testing: users with orders under increasing load');
  console.log('Load progression: 50 → 100 → 200 VUs');
  console.log('Goal: Find breaking point and measure degradation');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (GraphQL Stress) completed');
}

export { handleSummary };

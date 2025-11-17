// k6/scenarios/02-nested-data/load-graphql.js
// Scenario 2: Nested Data - GraphQL Load Test
// Fetch users with their orders - tests N+1 problem solution
//
// GraphQL Strategy: Single request with nested data using DataLoader batching
// Expected Result: 40-60% faster than REST (fewer HTTP round trips, batched queries)
//
// Query: users { id, email, orders { id, status, totalAmount } }
// This demonstrates GraphQL's advantage: one HTTP request for related data

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
  // Execute query - GraphQL fetches users AND orders in ONE HTTP request
  // DataLoader batches the order queries efficiently
  const response = graphqlQuery(QUERY);

  // Validate response
  checkGraphQLResponse(response);

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 2: Nested Data - GraphQL Load Test');
  console.log('Testing: users with orders query (demonstrates DataLoader batching)');
  console.log('Expected: 1 HTTP request for users + orders (vs REST: 1+N requests)');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 2 (GraphQL) completed');
}

// Export the custom summary handler
export { handleSummary };

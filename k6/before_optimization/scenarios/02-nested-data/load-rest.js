// k6/scenarios/02-nested-data/load-rest.js
// Scenario 2: Nested Data - REST Load Test
// Fetch users with their orders - demonstrates N+1 problem
//
// REST Strategy: Multiple requests (1 for users list, then N for each user's orders)
// Expected Result: 40-60% slower than GraphQL due to multiple HTTP round trips
//
// Requests: GET /users → GET /users/:id/orders (for each user)
// This demonstrates REST's N+1 problem: 1+N HTTP requests for related data

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
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

export default function () {
  // Step 1: Fetch list of users (1 request) - NO PAGINATION in before_optimization phase
  const usersResponse = restRequest('GET', '/users');
  checkResponse(usersResponse, 200, 'users fetched successfully');

  if (usersResponse.status === 200) {
    const usersData = JSON.parse(usersResponse.body);
    const users = usersData.data || usersData.users || [];

    // Limit to first 10 users in the client (simulating what pagination would do)
    // But still fetch ALL from server (demonstrating over-fetching before optimization)
    const limitedUsers = users.slice(0, 10);

    // Step 2: Fetch orders for EACH user (N requests - demonstrating N+1 problem)
    // This is the key difference: REST requires separate HTTP requests for related data
    limitedUsers.forEach((user) => {
      const ordersResponse = restRequest('GET', `/users/${user.id}/orders`);
      checkResponse(ordersResponse, 200, `orders fetched for user ${user.id}`);
    });

    // Total HTTP requests: 1 (users) + N (orders per user)
    // vs GraphQL: 1 HTTP request for everything
  }

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Load Test');
  console.log('Testing: GET /users → GET /users/:id/orders (N+1 problem)');
  console.log('Expected: 1+N HTTP requests (slower than GraphQL single request)');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 2 (REST) completed');
}

// Export the custom summary handler
export { handleSummary };

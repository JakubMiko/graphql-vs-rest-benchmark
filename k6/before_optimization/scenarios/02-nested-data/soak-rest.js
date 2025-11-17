// k6/scenarios/02-nested-data/soak-rest.js
// Scenario 2: Nested Data - REST Soak Test
// Long-duration test to detect memory leaks with N+1 query pattern
//
// Purpose: Verify stability over extended period with multiple requests per iteration
// Duration: 2 hours sustained load at 50 VUs
// Key Metrics: Connection pool stability, memory usage, response time consistency

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
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

export default function () {
  // Step 1: Fetch list of users - NO PAGINATION in before_optimization phase
  const usersResponse = restRequest('GET', '/users');
  checkResponse(usersResponse, 200, 'users fetched successfully');

  if (usersResponse.status === 200) {
    const usersData = JSON.parse(usersResponse.body);
    const users = usersData.data || usersData.users || [];

    // Limit to first 10 users in the client
    const limitedUsers = users.slice(0, 10);

    // Step 2: Fetch orders for each user (N+1 problem)
    // Over 2 hours, watch for connection pool issues or memory leaks
    limitedUsers.forEach((user) => {
      const ordersResponse = restRequest('GET', `/users/${user.id}/orders`);
      checkResponse(ordersResponse, 200, `orders fetched for user ${user.id}`);
    });
  }

  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Soak Test');
  console.log('Testing: Long-duration stability with N+1 query pattern');
  console.log('Duration: 2 hours sustained load at 50 VUs');
  console.log('Goal: Detect connection pool issues, memory leaks over time');
  console.log('Watch for: Connection exhaustion, gradual slowdown');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (REST Soak) completed');
  console.log('Check Grafana for connection pool and memory trends');
}

export { handleSummary };

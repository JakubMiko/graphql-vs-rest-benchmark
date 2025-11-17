// k6/scenarios/02-nested-data/stress-rest.js
// Scenario 2: Nested Data - REST Stress Test
// Fetch users with their orders under increasing load to find breaking point
//
// Purpose: Determine maximum capacity with N+1 query pattern
// Load: Ramp from 50 → 100 → 200 VUs to find system limits
// Key Metric: At what load does the N+1 problem cause cascading failures?

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../config.js';
import { restRequest, checkResponse } from '../../helpers.js';
import { handleSummary } from '../../summary.js';

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
    // Under high load, this pattern can cause severe performance degradation
    limitedUsers.forEach((user) => {
      const ordersResponse = restRequest('GET', `/users/${user.id}/orders`);
      checkResponse(ordersResponse, 200, `orders fetched for user ${user.id}`);
    });
  }

  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Stress Test');
  console.log('Testing: N+1 query pattern under increasing load');
  console.log('Load progression: 50 → 100 → 200 VUs');
  console.log('Goal: Measure how N+1 problem impacts performance at scale');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (REST Stress) completed');
}

export { handleSummary };

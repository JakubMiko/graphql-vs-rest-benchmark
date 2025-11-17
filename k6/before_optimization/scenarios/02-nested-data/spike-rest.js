// k6/scenarios/02-nested-data/spike-rest.js
// Scenario 2: Nested Data - REST Spike Test
// Sudden traffic burst to test elasticity with N+1 query pattern
//
// Purpose: Test how N+1 pattern handles sudden traffic spikes
// Pattern: Normal load → SUDDEN SPIKE to 200 VUs → back to normal
// Key Metric: Does N+1 problem cause cascading failures during spike?

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.spike,  // Allow some errors during spike
  scenarios: {
    'nested-data': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.spike,
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
    // During spike, this can cause severe connection pool exhaustion
    limitedUsers.forEach((user) => {
      const ordersResponse = restRequest('GET', `/users/${user.id}/orders`);
      checkResponse(ordersResponse, 200, `orders fetched for user ${user.id}`);
    });
  }

  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Spike Test');
  console.log('Testing: N+1 pattern during sudden traffic burst (20 → 200 → 20 VUs)');
  console.log('Duration: 2 minutes with 1-minute spike');
  console.log('Goal: Measure how N+1 pattern handles sudden load');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (REST Spike) completed');
}

export { handleSummary };

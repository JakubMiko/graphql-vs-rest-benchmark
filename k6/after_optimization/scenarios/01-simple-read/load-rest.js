// k6/after_optimization/scenarios/01-simple-read/load-rest.js
// Scenario 1: Simple Read - REST Load Test (OPTIMIZED PHASE)
// Fetch single user by ID - simplest possible operation with NO nested relations
//
// NOTE: This query doesn't benefit much from pagination/caching optimizations since
// it's a single record lookup. Included for consistency with baseline phase testing.
//
// Why Users: The Events API includes ticket_batches by default for better UX,
// which would add nested data. Users have no required relations, making this
// a true "simple read" test for baseline performance comparison.

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse, randomInt } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.load,
  scenarios: {
    'simple-read': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
    },
  },
};

export default function () {
  // Random user ID (we have 10,000 users seeded)
  const userId = randomInt(1, 10000);

  // Execute GET request (public endpoint, no auth required)
  // HTTP caching headers (ETag, Cache-Control) may improve response times
  const response = restRequest('GET', `/users/public/${userId}`);

  // Validate response
  checkResponse(response, 200, 'user fetched successfully');

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 1: Simple Read - REST Load Test (OPTIMIZED)');
  console.log('Testing: GET /users/public/:id (no auth, no nested relations)');
  console.log('Note: Single record lookup - minimal optimization impact expected');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 1 (REST OPTIMIZED) completed');
}

// Export the custom summary handler
export { handleSummary };

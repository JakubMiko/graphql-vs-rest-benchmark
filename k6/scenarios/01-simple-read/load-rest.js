// k6/scenarios/01-simple-read/load-rest.js
// Scenario 1: Simple Read - REST Load Test
// Fetch single user by ID - simplest possible operation with NO nested relations
//
// Why Users: The Events API includes ticket_batches by default for better UX,
// which would add nested data. Users have no required relations, making this
// a true "simple read" test for baseline performance comparison.

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../config.js';
import { restRequest, checkResponse, randomInt } from '../../helpers.js';

// Test configuration
export const options = {
  stages: TEST_STAGES.load,
  thresholds: THRESHOLDS.load,
  tags: {
    test_name: '01-simple-read-load-rest',
    scenario: '1',
    api: 'rest',
  },
};

export default function () {
  // Random user ID (we have 10,000 users seeded)
  const userId = randomInt(1, 10000);

  // Execute GET request
  const response = restRequest('GET', `/users/${userId}`);

  // Validate response
  checkResponse(response, 200, 'user fetched successfully');

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 1: Simple Read - REST Load Test');
  console.log('Testing: GET single user by ID (no nested relations)');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 1 (REST) completed');
}

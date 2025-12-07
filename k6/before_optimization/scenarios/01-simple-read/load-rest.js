// k6/scenarios/01-simple-read/load-rest.js
// Scenario 1: Simple Read - REST Load Test
// Fetch single user by ID - simplest possible operation with NO nested relations
//
// Why Users: The Events API includes ticket_batches by default for better UX,
// which would add nested data. Users have no required relations, making this
// a true "simple read" test for baseline performance comparison.

import { TEST_CONFIG, THRESHOLDS } from '../../../config.js';
import { restRequest, checkResponse, randomInt } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.phase1_comparison,
  // Use shared-iterations executor for fair comparison
  scenarios: {
    'simple-read': TEST_CONFIG.phase1_comparison.simple_read,
  },
};

export default function () {
  // Random user ID (we have 10,000 users seeded)
  const userId = randomInt(1, 10000);

  // Execute GET request (public endpoint, no auth required)
  const response = restRequest('GET', `/users/public/${userId}`);

  // Validate response
  checkResponse(response, 200, 'user fetched successfully');
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 1: Simple Read - REST Load Test');
  console.log('Testing: GET /users/public/:id (no auth, no nested relations)');
  console.log('Configuration: shared-iterations, 20 VUs, 10000 iterations');
  console.log('Note: First 1-2 seconds may show cold start (warm-up period)');

  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 1 (REST) completed');
}

// Export the custom summary handler
export { handleSummary };

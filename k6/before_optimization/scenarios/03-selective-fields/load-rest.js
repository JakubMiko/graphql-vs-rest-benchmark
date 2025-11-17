// k6/scenarios/04-selective-fields/load-rest.js
// Scenario 4: Selective Fields - REST Load Test
// Fetch events - REST returns ALL fields regardless of what we need
//
// This demonstrates REST's over-fetching problem.
// Even though we only need id and name, REST returns all ~10 fields:
// id, name, description, place, date, category, created_at, updated_at, etc.

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
    'selective-fields': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
    },
  },
};

export default function () {
  // Execute GET request - REST will return ALL fields
  // We only need id and name, but we'll get description, date, place, category, timestamps, etc.
  // Limiting to 100 events for fair comparison with GraphQL
  // Note: In phase 1 (before_optimization), we're NOT using pagination params
  // Instead, the API returns first 100 events by default (server-side limit)
  const response = restRequest('GET', '/events');

  // Validate response
  checkResponse(response, 200, 'events fetched successfully');

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 4: Selective Fields - REST Load Test');
  console.log('Testing: GET /events (returns all fields)');
  console.log('Expected: Over-fetching - receives all ~10 fields even though only id, name needed');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 4 (REST) completed');
  console.log('Check data_received metric - should be 60-80% more than GraphQL');
}

// Export the custom summary handler
export { handleSummary };

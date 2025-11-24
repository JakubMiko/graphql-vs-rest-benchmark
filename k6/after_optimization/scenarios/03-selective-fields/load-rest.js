// k6/after_optimization/scenarios/03-selective-fields/load-rest.js
// Scenario 3: Selective Fields - REST Load Test (OPTIMIZED PHASE)
// Fetch events - REST returns ALL fields regardless of what we need
//
// OPTIMIZATIONS:
//   - Offset-based pagination (per_page=10 for consistency)
//   - HTTP caching (ETag, Cache-Control headers)
//
// This demonstrates REST's over-fetching problem.
// Even though we only need id and name, REST returns all ~10 fields:
// id, name, description, place, date, category, created_at, updated_at, etc.
//
// Key comparison: data_received metric should be 60-80% MORE than GraphQL

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.load,
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
  // Using pagination: per_page=10 for consistency across all after_optimization tests
  // HTTP caching may help with repeated requests
  const response = restRequest('GET', '/events?page=1&per_page=10');

  // Validate response
  checkResponse(response, 200, 'events fetched successfully');

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 3: Selective Fields - REST Load Test (OPTIMIZED)');
  console.log('Testing: GET /events?page=1&per_page=10 (returns all fields)');
  console.log('Optimizations:');
  console.log('  - Offset-based pagination (per_page=10)');
  console.log('  - HTTP caching (ETag, Cache-Control)');
  console.log('Expected: Over-fetching - receives all ~10 fields even though only id, name needed');
  console.log('Expected: data_received should be 60-80% MORE than GraphQL');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 3 (REST OPTIMIZED) completed');
  console.log('Check data_received metric - should be significantly more than GraphQL');
}

// Export the custom summary handler
export { handleSummary };

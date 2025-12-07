// k6/scenarios/03-selective-fields/load-rest.js
// Scenario 3: Selective Fields - REST Load Test
// Fetch events with ALL fields - demonstrates REST's over-fetching problem
//
// This demonstrates REST's limitation: the /events endpoint returns ALL fields
// even though we might only need id and name (like GraphQL does).
// REST returns all ~10 fields (id, name, description, place, date, category, timestamps, etc.)

import { TEST_CONFIG, THRESHOLDS } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.phase1_comparison,
  // Use shared-iterations executor for fair comparison with GraphQL
  scenarios: {
    'selective-fields': TEST_CONFIG.phase1_comparison.selective_fields,
  },
};

export default function () {
  // Fetch first 20 events (matching GraphQL's first: 20)
  // REST limitation: Returns ALL fields even though we might only need id and name
  // The API doesn't support field selection - it always returns the full event object
  const response = restRequest('GET', '/events?page=1&per_page=20');

  // Validate response
  checkResponse(response, 200, 'fetch events successful');
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 3: Selective Fields - REST Load Test');
  console.log('Testing: GET /events (returns ALL fields)');
  console.log('Expected: Higher data transfer due to over-fetching');
  console.log('Note: REST cannot select specific fields, returns full objects');
  console.log('Configuration: shared-iterations, 20 VUs, 10000 iterations');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 3 (REST) completed');
  console.log('Check data_received metric - should be 60-80% MORE than GraphQL');
  console.log('This demonstrates REST over-fetching: all fields returned, not just id+name');
}

// Export the custom summary handler
export { handleSummary };

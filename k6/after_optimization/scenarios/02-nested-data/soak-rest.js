// k6/after_optimization/scenarios/02-nested-data/soak-rest.js
// Scenario 2: Nested Data - REST Soak Test (OPTIMIZED PHASE)
// Long-running test (2 hours) to detect memory leaks and cache stability
//
// Key Metrics: Memory usage stability, cache effectiveness, query performance over time
// With caching: Should maintain stable memory and consistent performance

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.soak,
  scenarios: {
    'nested-data-soak': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.soak,
    },
  },
};

export default function () {
  // Fetch events with pagination
  const eventsResponse = restRequest('GET', '/events?page=1&per_page=10');
  checkResponse(eventsResponse, 200, 'events fetched successfully');

  if (eventsResponse.status === 200) {
    const eventsData = JSON.parse(eventsResponse.body);
    const events = eventsData.data || eventsData.events || [];

    // Fetch ticket_batches for each event (N+1 problem)
    events.forEach((event) => {
      const ticketBatchesResponse = restRequest('GET', `/events/${event.id}/ticket_batches`);
      checkResponse(ticketBatchesResponse, 200, `ticket_batches fetched for event ${event.id}`);
    });
  }

  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Soak Test (OPTIMIZED)');
  console.log('Testing: events with ticket_batches (Pagination + HTTP Caching)');
  console.log('Goal: Detect memory leaks, cache stability over 2 hours');
  console.log('Target: 50 VUs sustained for 2 hours');
  console.log('');
  console.log('Monitoring:');
  console.log('  - Rails memory (should not grow unbounded)');
  console.log('  - HTTP cache hit rate (via response headers)');
  console.log('  - Query performance (should remain consistent)');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 Soak Test (REST OPTIMIZED) completed');
  console.log('Review Docker stats for memory trends');
}

export { handleSummary };

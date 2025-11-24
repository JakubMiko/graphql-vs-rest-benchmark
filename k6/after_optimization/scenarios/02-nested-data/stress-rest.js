// k6/after_optimization/scenarios/02-nested-data/stress-rest.js
// Scenario 2: Nested Data - REST Stress Test (OPTIMIZED PHASE)
// Find breaking point by ramping up to 200 VUs - tests scalability with pagination + caching
//
// Key Metric: At what load does REST nested query performance degrade?
// With optimizations: HTTP caching may delay degradation under repeated requests

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.stress,
  scenarios: {
    'nested-data-stress': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.stress,
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
  console.log('Starting Scenario 2: Nested Data - REST Stress Test (OPTIMIZED)');
  console.log('Testing: events with ticket_batches (Pagination + HTTP Caching)');
  console.log('Goal: Find breaking point with caching layer');
  console.log('Target: Ramp from 0 → 200 VUs over 10 minutes');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 Stress Test (REST OPTIMIZED) completed');
  console.log('Review p95/p99 latencies to identify breaking point');
}

export { handleSummary };

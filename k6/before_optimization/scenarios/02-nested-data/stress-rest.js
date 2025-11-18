// k6/scenarios/02-nested-data/stress-rest.js
// Scenario 2: Nested Data - REST Stress Test
// Fetch events with their ticket batches under increasing load to find breaking point
//
// Purpose: Determine maximum capacity with N+1 query pattern
// Load: Ramp from 50 → 100 → 200 VUs to find system limits
// Key Metric: At what load does the N+1 problem cause cascading failures?

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

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
  // Step 1: Fetch list of events (1 request) - NO PAGINATION in before_optimization phase
  const eventsResponse = restRequest('GET', '/events');
  checkResponse(eventsResponse, 200, 'events fetched successfully');

  if (eventsResponse.status === 200) {
    const eventsData = JSON.parse(eventsResponse.body);
    const events = eventsData.data || eventsData.events || [];

    // Limit to first 10 events in the client (simulating what pagination would do)
    // But still fetch ALL from server (demonstrating over-fetching before optimization)
    const limitedEvents = events.slice(0, 10);

    // Step 2: Fetch ticket_batches for EACH event (N requests - demonstrating N+1 problem)
    // Under high load, this pattern can cause severe performance degradation
    limitedEvents.forEach((event) => {
      const ticketBatchesResponse = restRequest('GET', `/events/${event.id}/ticket_batches`);
      checkResponse(ticketBatchesResponse, 200, `ticket_batches fetched for event ${event.id}`);
    });

    // Total HTTP requests: 1 (events) + N (ticket_batches per event)
    // vs GraphQL: 1 HTTP request for everything
  }

  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Stress Test');
  console.log('Testing: GET /events → GET /events/:id/ticket_batches (N+1 problem)');
  console.log('Expected: 1+N HTTP requests under increasing load');
  console.log('Load progression: 50 → 100 → 200 VUs');
  console.log('Goal: Measure how N+1 problem impacts performance at scale');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (REST Stress) completed');
}

export { handleSummary };

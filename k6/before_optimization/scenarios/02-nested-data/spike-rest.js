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
    // During spike, this can cause severe connection pool exhaustion
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
  console.log('Starting Scenario 2: Nested Data - REST Spike Test');
  console.log('Testing: GET /events → GET /events/:id/ticket_batches (N+1 problem)');
  console.log('Expected: 1+N HTTP requests during sudden traffic burst (20 → 200 → 20 VUs)');
  console.log('Duration: 2 minutes with 1-minute spike');
  console.log('Goal: Measure how N+1 pattern handles sudden load');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (REST Spike) completed');
}

export { handleSummary };

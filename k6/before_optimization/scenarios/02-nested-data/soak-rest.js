// k6/scenarios/02-nested-data/soak-rest.js
// Scenario 2: Nested Data - REST Soak Test
// Long-duration test to detect memory leaks and stability with N+1 query pattern
//
// Purpose: Verify stability over extended period with multiple requests per iteration
// Duration: 2 hours sustained load at 50 VUs
// Key Metrics: Connection pool stability, memory usage, response time consistency

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.soak,  // Performance should remain stable
  scenarios: {
    'nested-data': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.soak,
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
    // Over 2 hours, watch for connection pool issues or memory leaks
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
  console.log('Starting Scenario 2: Nested Data - REST Soak Test');
  console.log('Testing: GET /events → GET /events/:id/ticket_batches (N+1 problem)');
  console.log('Expected: 1+N HTTP requests sustained over 2 hours');
  console.log('Duration: 2 hours sustained load at 50 VUs');
  console.log('Goal: Detect connection pool issues, memory leaks over time');
  console.log('Watch for: Connection exhaustion, gradual slowdown');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (REST Soak) completed');
  console.log('Check Grafana for connection pool and memory trends');
}

export { handleSummary };

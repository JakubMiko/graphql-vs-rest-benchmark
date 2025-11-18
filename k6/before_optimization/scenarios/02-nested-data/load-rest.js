// k6/scenarios/02-nested-data/load-rest.js
// Scenario 2: Nested Data - REST Load Test
// Fetch events with their ticket batches - demonstrates N+1 problem
//
// REST Strategy: Multiple requests (1 for events list, then N for each event's ticket_batches)
// Expected Result: 40-60% slower than GraphQL due to multiple HTTP round trips
//
// Requests: GET /events → GET /events/:id/ticket_batches (for each event)
// This demonstrates REST's N+1 problem: 1+N HTTP requests for related data

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
    'nested-data': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
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
    // This is the key difference: REST requires separate HTTP requests for related data
    limitedEvents.forEach((event) => {
      const ticketBatchesResponse = restRequest('GET', `/events/${event.id}/ticket_batches`);
      checkResponse(ticketBatchesResponse, 200, `ticket_batches fetched for event ${event.id}`);
    });

    // Total HTTP requests: 1 (events) + N (ticket_batches per event)
    // vs GraphQL: 1 HTTP request for everything
  }

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Load Test');
  console.log('Testing: GET /events → GET /events/:id/ticket_batches (N+1 problem)');
  console.log('Expected: 1+N HTTP requests (slower than GraphQL single request)');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 2 (REST) completed');
}

// Export the custom summary handler
export { handleSummary };

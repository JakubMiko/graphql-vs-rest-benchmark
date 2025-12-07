// k6/scenarios/02-nested-data/load-rest.js
// Scenario 2: Nested Data - REST Load Test
// Fetch events with their ticket batches - demonstrates N+1 problem
//
// REST Strategy: Multiple requests (1 for events list, then N for each event's ticket_batches)
// Expected Result: 40-60% slower than GraphQL due to multiple HTTP round trips
//
// Requests: GET /events → GET /events/:id/ticket_batches (for each event)
// This demonstrates REST's N+1 problem: 1+N HTTP requests for related data

import { TEST_CONFIG, THRESHOLDS } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.phase1_comparison,
  // Use shared-iterations executor for fair comparison
  scenarios: {
    'nested-data': TEST_CONFIG.phase1_comparison.nested_data,
  },
};

export default function () {
  // Step 1: Fetch list of events (1 request)
  // REST API returns first 20 events by default (per_page=20)
  const eventsResponse = restRequest('GET', '/events');
  checkResponse(eventsResponse, 200, 'events fetched successfully');

  if (eventsResponse.status === 200) {
    const eventsData = JSON.parse(eventsResponse.body);
    const events = eventsData.data || eventsData.events || [];

    // Step 2: Fetch ticket_batches for EACH event (N requests - demonstrating N+1 problem)
    // This is the key difference: REST requires separate HTTP requests for related data
    events.forEach((event) => {
      const ticketBatchesResponse = restRequest('GET', `/events/${event.id}/ticket_batches`);
      checkResponse(ticketBatchesResponse, 200, `ticket_batches fetched for event ${event.id}`);
    });

    // Total HTTP requests: 1 (events) + 20 (ticket_batches per event) = 21 requests
    // vs GraphQL: 1 HTTP request for everything
  }
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Load Test');
  console.log('Testing: GET /events → GET /events/:id/ticket_batches (N+1 problem)');
  console.log('Expected: 1+N HTTP requests (slower than GraphQL single request)');
  console.log('Configuration: shared-iterations, 20 VUs, 5000 iterations');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 2 (REST) completed');
}

// Export the custom summary handler
export { handleSummary };

// k6/after_optimization/scenarios/02-nested-data/load-rest.js
// Scenario 2: Nested Data - REST Load Test (OPTIMIZED PHASE)
// Fetch events with their ticket batches - demonstrates N+1 problem with PAGINATION
//
// REST Strategy: Multiple requests (1 for events list, then N for each event's ticket_batches)
// OPTIMIZATIONS:
//   - Offset-based pagination (page/per_page parameters)
//   - HTTP caching (ETag, Cache-Control headers)
//   - Limited to 10 events per page (matches GraphQL first: 10)
//
// Expected Result: Still slower than GraphQL due to N+1 HTTP requests, but improved from baseline
//
// Requests: GET /events?page=1&per_page=10 → GET /events/:id/ticket_batches (for each event)
// This demonstrates REST's N+1 problem: 1+N HTTP requests for related data

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.load,
  scenarios: {
    'nested-data': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
    },
  },
};

export default function () {
  // Step 1: Fetch list of events WITH PAGINATION (page=1, per_page=10)
  // This matches GraphQL's first: 10 for fair comparison
  const eventsResponse = restRequest('GET', '/events?page=1&per_page=10');
  checkResponse(eventsResponse, 200, 'events fetched successfully');

  if (eventsResponse.status === 200) {
    const eventsData = JSON.parse(eventsResponse.body);
    const events = eventsData.data || eventsData.events || [];

    // Step 2: Fetch ticket_batches for EACH event (N requests - demonstrating N+1 problem)
    // Even with pagination, REST still requires separate HTTP requests for related data
    // HTTP caching may help if same events are requested repeatedly
    events.forEach((event) => {
      const ticketBatchesResponse = restRequest('GET', `/events/${event.id}/ticket_batches`);
      checkResponse(ticketBatchesResponse, 200, `ticket_batches fetched for event ${event.id}`);
    });

    // Total HTTP requests: 1 (events) + N (ticket_batches per event) = 11 requests
    // vs GraphQL: 1 HTTP request for everything
  }

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Load Test (OPTIMIZED)');
  console.log('Testing: GET /events?page=1&per_page=10 → GET /events/:id/ticket_batches');
  console.log('Optimizations:');
  console.log('  - Offset-based pagination (per_page=10)');
  console.log('  - HTTP caching (ETag, Cache-Control)');
  console.log('Expected: 1+10 HTTP requests (N+1 problem persists, but less data transferred)');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 2 (REST OPTIMIZED) completed');
  console.log('Check if HTTP caching reduced response times for repeated requests');
}

// Export the custom summary handler
export { handleSummary };

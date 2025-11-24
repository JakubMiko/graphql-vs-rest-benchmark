// k6/after_optimization/scenarios/05-concurrent-users/load-rest.js
// Scenario 5: Concurrent Users - REST Load Test (OPTIMIZED PHASE)
// Simulates realistic user journey: browse → view details → login → purchase → verify
//
// OPTIMIZATIONS IN THIS TEST:
//   - Browse events: Paginated (per_page=10) + HTTP cached
//   - Event details: HTTP cached (ETag, Cache-Control)
//   - Mutations: Standard write operations (no caching benefit)
//
// This tests real-world usage patterns with mixed read/write operations + caching benefits

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse, randomInt } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.load,
  scenarios: {
    'concurrent-users': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
    },
  },
};

// Use a pre-seeded test user for authentication
const TEST_USER_EMAIL = 'test@benchmark.com';
const TEST_USER_PASSWORD = 'password123';

export function setup() {
  console.log('Starting Scenario 5: Concurrent Users - REST Load Test (OPTIMIZED)');
  console.log('Simulating realistic user journey with caching...');
  console.log('');
  console.log('User flow:');
  console.log('1. Browse events (PAGINATED + HTTP CACHED)');
  console.log('2. View event details (HTTP CACHED)');
  console.log('3. Login (authenticated user)');
  console.log('4. Create order');
  console.log('5. View my orders');
  console.log('');
  console.log('Cache expectations:');
  console.log('  - Browse events: HTTP cache hits for repeated requests');
  console.log('  - Event details: HTTP cache hits for popular events');
  console.log('  - Orders: Not cached (user-specific, frequently changing)');
  console.log('');

  // Login once at the start to get auth token
  const loginResponse = restRequest('POST', '/users/login', {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (loginResponse.status === 200) {
    const data = JSON.parse(loginResponse.body);
    const token = data.token || data.data?.token;

    if (token) {
      console.log('Authentication successful');
      console.log('Target: 50 VUs for 3 minutes');
      return { token };
    }
  }

  console.error('Authentication failed - tests will fail');
  return { token: null };
}

export default function (data) {
  const token = data.token;

  if (!token) {
    console.error('No auth token available');
    return;
  }

  // Step 1: Browse events (with pagination - matches GraphQL first: 10)
  // HTTP caching should help with repeated requests
  const eventsResponse = restRequest('GET', '/events?page=1&per_page=10');
  checkResponse(eventsResponse, 200, 'browse events successful');

  let events = [];
  if (eventsResponse.status === 200) {
    const eventsData = JSON.parse(eventsResponse.body);
    events = eventsData.data || [];
  }

  sleep(SLEEP_DURATION.between_requests);

  // Step 2: View event details (pick random event)
  // HTTP caching should help for popular events
  if (events.length > 0) {
    const randomEvent = events[randomInt(0, Math.min(events.length - 1, 9))]; // From paginated results
    const eventId = randomEvent.id;

    const eventResponse = restRequest('GET', `/events/${eventId}`);
    checkResponse(eventResponse, 200, 'view event details successful');

    let ticketBatches = [];
    if (eventResponse.status === 200) {
      const eventData = JSON.parse(eventResponse.body);
      // Extract ticket batches from included data or relationships
      ticketBatches = eventData.included?.filter(item => item.type === 'ticket_batch') || [];
    }

    sleep(SLEEP_DURATION.between_requests);

    // Step 3: Create order (authenticated user)
    // Pick a random ticket batch from the event
    if (ticketBatches.length > 0) {
      const randomBatch = ticketBatches[randomInt(0, ticketBatches.length - 1)];
      const ticketBatchId = parseInt(randomBatch.id);
      const quantity = randomInt(1, 3); // Buy 1-3 tickets

      const orderResponse = restRequest(
        'POST',
        '/orders',
        {
          ticket_batch_id: ticketBatchId,
          quantity: quantity,
        },
        token
      );

      checkResponse(orderResponse, 201, 'create order successful');

      sleep(SLEEP_DURATION.between_requests);

      // Step 4: View my orders (verify order was created)
      const myOrdersResponse = restRequest('GET', '/orders', null, token);
      checkResponse(myOrdersResponse, 200, 'view my orders successful');
    }
  }

  // Sleep before next iteration
  sleep(SLEEP_DURATION.between_iterations);
}

export function teardown(data) {
  console.log('Scenario 5 (REST OPTIMIZED) completed');
  console.log('');
  console.log('Review metrics:');
  console.log('  - Compare http_req_duration with baseline');
  console.log('  - Check for HTTP cache hits in response headers');
  console.log('  - Verify end-to-end journey success rate');
  console.log('Note: Created orders should be cleaned up with cleanup-test-data.sh');
}

export { handleSummary };

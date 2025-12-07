// k6/scenarios/05-concurrent-users/load-rest.js
// Scenario 5: Concurrent Users - REST Load Test
// Simulates realistic user journey: browse → view details → login → purchase → verify
//
// This tests real-world usage patterns with mixed read/write operations

import { TEST_CONFIG, THRESHOLDS } from '../../../config.js';
import { restRequest, checkResponse, randomInt } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.phase1_comparison,
  scenarios: {
    'concurrent-users': TEST_CONFIG.phase1_comparison.concurrent_users,
  },
};

// Use a pre-seeded test user for authentication
const TEST_USER_EMAIL = 'test@benchmark.com';
const TEST_USER_PASSWORD = 'password123';

export function setup() {
  console.log('Starting Scenario 5: Concurrent Users - REST Load Test');
  console.log('Simulating realistic user journey...');
  console.log('');
  console.log('User flow:');
  console.log('1. Browse events');
  console.log('2. View event details');
  console.log('3. Login (authenticated user)');
  console.log('4. Create order');
  console.log('5. View my orders');
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
      console.log('Configuration: shared-iterations, 10 VUs, 1000 iterations');
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

  // Step 1: Browse events (anonymous user behavior)
  // REST API returns first 20 events by default (per_page=20)
  const eventsResponse = restRequest('GET', '/events');
  checkResponse(eventsResponse, 200, 'browse events successful');

  let events = [];
  if (eventsResponse.status === 200) {
    const eventsData = JSON.parse(eventsResponse.body);
    events = eventsData.data || [];
  }

  // Step 2: View event details (pick random event)
  if (events.length > 0) {
    const randomEvent = events[randomInt(0, Math.min(events.length - 1, 20))]; // First 20 events
    const eventId = randomEvent.id;

    const eventResponse = restRequest('GET', `/events/${eventId}`);
    checkResponse(eventResponse, 200, 'view event details successful');

    let ticketBatches = [];
    if (eventResponse.status === 200) {
      const eventData = JSON.parse(eventResponse.body);
      // Extract ticket batches from included data or relationships
      ticketBatches = eventData.included?.filter(item => item.type === 'ticket_batch') || [];
    }

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

      // Step 4: View my orders (verify order was created)
      // Use pagination to limit response size (default: 20 orders per page)
      const myOrdersResponse = restRequest('GET', '/orders?page=1&per_page=20', null, token);
      checkResponse(myOrdersResponse, 200, 'view my orders successful');
    }
  }
}

export function teardown(data) {
  console.log('Scenario 5 (REST) completed');
  console.log('Note: Created orders should be cleaned up with cleanup-test-data.sh');
}

export { handleSummary };

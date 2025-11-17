// k6/scenarios/05-concurrent-users/load-graphql.js
// Scenario 5: Concurrent Users - GraphQL Load Test
// Simulates realistic user journey: browse → view details → login → purchase → verify
//
// This tests real-world usage patterns with mixed read/write operations

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse, randomInt } from '../../../helpers.js';
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

// GraphQL Queries and Mutations

const BROWSE_EVENTS_QUERY = `
  query BrowseEvents {
    events {
      id
      name
      description
      place
      date
    }
  }
`;

const EVENT_DETAILS_QUERY = `
  query EventDetails($id: ID!) {
    event(id: $id) {
      id
      name
      ticketBatches {
        id
        price
        availableTickets
        saleStart
        saleEnd
      }
    }
  }
`;

const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        status
        totalPrice
        tickets {
          id
        }
      }
      errors
    }
  }
`;

const MY_ORDERS_QUERY = `
  query MyOrders {
    myOrders {
      id
      status
      totalPrice
      quantity
      tickets {
        id
      }
      ticketBatch {
        id
      }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      user {
        id
        email
      }
      errors
    }
  }
`;

export function setup() {
  console.log('Starting Scenario 5: Concurrent Users - GraphQL Load Test');
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
  const loginResponse = graphqlQuery(LOGIN_MUTATION, {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (loginResponse.status === 200) {
    const data = JSON.parse(loginResponse.body);
    const token = data.data?.login?.token;

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

  // Step 1: Browse events (anonymous user behavior)
  const eventsResponse = graphqlQuery(BROWSE_EVENTS_QUERY);

  // Debug: Check for errors in browse events
  if (eventsResponse.status === 200) {
    const responseData = JSON.parse(eventsResponse.body);
    if (responseData.errors && responseData.errors.length > 0) {
      console.log('[STEP 1] Browse events GraphQL errors:', JSON.stringify(responseData.errors));
    }
  }

  checkGraphQLResponse(eventsResponse);

  let events = [];
  if (eventsResponse.status === 200) {
    const eventsData = JSON.parse(eventsResponse.body);
    events = eventsData.data?.events || [];

    // Debug: Log events count
    if (events.length === 0) {
      console.log('[DEBUG] events.length is 0! Response data:', JSON.stringify(eventsData).substring(0, 500));
    }
  }

  sleep(SLEEP_DURATION.between_requests);

  // Step 2: View event details (pick random event)
  if (events.length > 0) {
    const randomEvent = events[randomInt(0, Math.min(events.length - 1, 20))]; // First 20 events
    const eventId = randomEvent.id;

    const eventResponse = graphqlQuery(EVENT_DETAILS_QUERY, { id: eventId });

    // Debug: Check for errors in event details
    if (eventResponse.status === 200) {
      const responseData = JSON.parse(eventResponse.body);
      if (responseData.errors && responseData.errors.length > 0) {
        console.log('[STEP 2] Event details GraphQL errors:', JSON.stringify(responseData.errors));
      }
    }

    checkGraphQLResponse(eventResponse);

    let ticketBatches = [];
    if (eventResponse.status === 200) {
      const eventData = JSON.parse(eventResponse.body);
      ticketBatches = eventData.data?.event?.ticketBatches || [];
    }

    sleep(SLEEP_DURATION.between_requests);

    // Step 3: Create order (authenticated user)
    // Pick a random ticket batch from the event
    if (ticketBatches.length > 0) {
      const randomBatch = ticketBatches[randomInt(0, ticketBatches.length - 1)];
      const ticketBatchId = randomBatch.id;
      const quantity = randomInt(1, 3); // Buy 1-3 tickets

      const orderResponse = graphqlQuery(
        CREATE_ORDER_MUTATION,
        {
          input: {
            ticketBatchId: ticketBatchId,
            quantity: quantity,
          },
        },
        token
      );

      // Debug logging to see actual response
      if (orderResponse.status === 200) {
        const responseData = JSON.parse(orderResponse.body);
        if (responseData.errors && responseData.errors.length > 0) {
          console.log('[STEP 3] CreateOrder GraphQL errors:', JSON.stringify(responseData.errors));
        }
        if (responseData.data?.createOrder?.errors && responseData.data.createOrder.errors.length > 0) {
          console.log('[STEP 3] CreateOrder mutation errors:', JSON.stringify(responseData.data.createOrder.errors));
        }
        if (!responseData.data?.createOrder?.order) {
          console.log('[STEP 3] CreateOrder failed - no order returned');
        }
      }

      checkGraphQLResponse(orderResponse);

      sleep(SLEEP_DURATION.between_requests);

      // Step 4: View my orders (verify order was created)
      const myOrdersResponse = graphqlQuery(MY_ORDERS_QUERY, {}, token);

      // Debug: Check for errors in my orders
      if (myOrdersResponse.status === 200) {
        const responseData = JSON.parse(myOrdersResponse.body);
        if (responseData.errors && responseData.errors.length > 0) {
          console.log('[STEP 4] MyOrders GraphQL errors:', JSON.stringify(responseData.errors));
        }
      }

      checkGraphQLResponse(myOrdersResponse);
    }
  }

  // Sleep before next iteration
  sleep(SLEEP_DURATION.between_iterations);
}

export function teardown(data) {
  console.log('Scenario 5 (GraphQL) completed');
  console.log('Note: Created orders should be cleaned up with cleanup-test-data.sh');
}

export { handleSummary };

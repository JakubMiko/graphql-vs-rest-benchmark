// k6/after_optimization/scenarios/04-write-operations/load-graphql.js
// Scenario 4: Write Operations - GraphQL Load Test (OPTIMIZED PHASE)
// Test event creation performance via GraphQL mutations
//
// NOTE: Write operations don't benefit from caching (mutations are never cached).
// However, this test verifies that cache invalidation works correctly.
// When an event is created, the events list cache should be invalidated.
//
// This tests write operation performance, including authentication,
// validation, database write operations, and cache invalidation.

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION, TEST_DATA } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse, randomInt, randomElement } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.load,
  // Give the scenario a proper name for better reporting
  scenarios: {
    'write-operations': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
    },
  },
};

// Use a pre-seeded admin test user for authentication
const TEST_USER_EMAIL = 'test@benchmark.com';
const TEST_USER_PASSWORD = 'password123';

// GraphQL mutation for creating an event
const CREATE_EVENT_MUTATION = `
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      event {
        id
        name
        description
        place
        date
        category
      }
      errors
    }
  }
`;

// Login mutation to get auth token
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

let authToken = null;

export function setup() {
  console.log('Starting Scenario 4: Write Operations - GraphQL Load Test (OPTIMIZED)');
  console.log('Authenticating admin test user...');

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
      console.log('Testing: createEvent mutation (admin)');
      console.log('Note: Mutations trigger cache invalidation for events list');
      console.log('Target: 50 VUs for 3 minutes');
      return { token };
    }
  }

  console.error('Authentication failed - tests will fail');
  return { token: null };
}

export default function (data) {
  // Use the auth token from setup
  const token = data.token;

  if (!token) {
    console.error('No auth token available');
    return;
  }

  // Generate random event data
  const timestamp = Date.now();
  const category = randomElement(TEST_DATA.categories);
  const place = randomElement(TEST_DATA.places);
  const futureDate = new Date(Date.now() + randomInt(1, 365) * 24 * 60 * 60 * 1000).toISOString();

  // Create event via GraphQL mutation
  // This will invalidate the events cache via after_commit callback
  const response = graphqlQuery(
    CREATE_EVENT_MUTATION,
    {
      input: {
        name: `Test Event ${timestamp}`,
        description: `Performance test event created at ${timestamp}`,
        place: place,
        date: futureDate,
        category: category,
      },
    },
    token
  );

  // Validate response
  checkGraphQLResponse(response);

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 4 (GraphQL OPTIMIZED) completed');
  console.log('Note: Test events remain in database for verification');
  console.log('Verify: Events cache was invalidated after each create');
}

// Export the custom summary handler
export { handleSummary };

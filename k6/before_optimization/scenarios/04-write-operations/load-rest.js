// k6/scenarios/04-write-operations/load-rest.js
// Scenario 4: Write Operations - REST Load Test
// Test event creation performance via REST POST endpoint
//
// This tests write operation performance, including authentication,
// validation, and database write operations.

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION, TEST_DATA } from '../../../config.js';
import { restRequest, checkResponse, randomInt, randomElement } from '../../../helpers.js';
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

let authToken = null;

export function setup() {
  console.log('Starting Scenario 4: Write Operations - REST Load Test');
  console.log('Authenticating admin test user...');

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
      console.log('Testing: POST /events (admin)');
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

  // Create event via REST POST
  const response = restRequest(
    'POST',
    '/events',
    {
      name: `Test Event ${timestamp}`,
      description: `Performance test event created at ${timestamp}`,
      place: place,
      date: futureDate,
      category: category,
    },
    token
  );

  // Validate response (201 Created)
  checkResponse(response, 201, 'event created successfully');

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 4 (REST) completed');
  console.log('Note: Test events remain in database for verification');
}

// Export the custom summary handler
export { handleSummary };

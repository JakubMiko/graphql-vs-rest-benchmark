// k6/scenarios/01-simple-read/load-graphql.js
// Scenario 1: Simple Read - GraphQL Load Test
// Fetch single user by ID - simplest possible operation with NO nested relations
//
// Why Users: The Events API includes ticket_batches by default for better UX,
// which would add nested data. Users have no required relations, making this
// a true "simple read" test for baseline performance comparison.

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse, randomInt } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.load,
  // Give the scenario a proper name for better reporting
  scenarios: {
    'simple-read': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.load,
    },
  },
};

// GraphQL query for fetching a single user (public endpoint, no auth required)
const QUERY = `
  query GetPublicUser($id: ID!) {
    publicUser(id: $id) {
      id
      email
      firstName
      lastName
      createdAt
    }
  }
`;

export default function () {
  // Random user ID (we have 10,000 users seeded)
  const userId = randomInt(1, 10000);

  // Execute query
  const response = graphqlQuery(QUERY, { id: userId.toString() });

  // Validate response
  checkGraphQLResponse(response);

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 1: Simple Read - GraphQL Load Test');
  console.log('Testing: publicUser query (no auth, no nested relations)');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 1 (GraphQL) completed');
}

// Export the custom summary handler
export { handleSummary };

// k6/scenarios/01-simple-read/load-graphql.js
// Scenario 1: Simple Read - GraphQL Load Test
// Fetch single user by ID - simplest possible operation with NO nested relations
//
// Why Users: The Events API includes ticket_batches by default for better UX,
// which would add nested data. Users have no required relations, making this
// a true "simple read" test for baseline performance comparison.

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../config.js';
import { graphqlQuery, checkGraphQLResponse, randomInt } from '../../helpers.js';

// Test configuration
export const options = {
  stages: TEST_STAGES.load,
  thresholds: THRESHOLDS.load,
  tags: {
    test_name: '01-simple-read-load-graphql',
    scenario: '1',
    api: 'graphql',
  },
};

// GraphQL query for fetching a single user
const QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      admin
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
  console.log('Testing: GET single user by ID (no nested relations)');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 1 (GraphQL) completed');
}

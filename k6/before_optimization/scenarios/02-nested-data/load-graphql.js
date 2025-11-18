// k6/scenarios/02-nested-data/load-graphql.js
// Scenario 2: Nested Data - GraphQL Load Test
// Fetch events with their ticket batches - tests N+1 problem solution
//
// GraphQL Strategy: Single request with nested data using DataLoader batching
// Expected Result: 40-60% faster than REST (fewer HTTP round trips, batched queries)
//
// Query: events { id, name, ticketBatches { id, price, availableTickets } }
// This demonstrates GraphQL's advantage: one HTTP request for related data

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
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

// GraphQL query for fetching events with their ticket batches (nested data)
const QUERY = `
  query GetEventsWithTicketBatches {
    events {
      id
      name
      place
      date
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

export default function () {
  // Execute query - GraphQL fetches events AND ticket_batches in ONE HTTP request
  // DataLoader batches the ticket_batch queries efficiently
  const response = graphqlQuery(QUERY);

  // Validate response
  checkGraphQLResponse(response);

  // Sleep between requests to simulate real user behavior
  sleep(SLEEP_DURATION.between_requests);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 2: Nested Data - GraphQL Load Test');
  console.log('Testing: events with ticket_batches query (demonstrates DataLoader batching)');
  console.log('Expected: 1 HTTP request for events + ticket_batches (vs REST: 1+N requests)');
  console.log('Target: 50 VUs for 3 minutes');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 2 (GraphQL) completed');
}

// Export the custom summary handler
export { handleSummary };

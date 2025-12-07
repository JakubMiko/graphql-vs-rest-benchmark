// k6/scenarios/02-nested-data/stress-graphql.js
// Scenario 2: Nested Data - GraphQL Stress Test
// Fetch events with their ticket batches under increasing load to find breaking point
//
// Purpose: Determine maximum capacity and performance degradation pattern
// Load: Ramp from 50 → 100 → 200 VUs to find system limits
// Key Metric: At what load does GraphQL nested query performance degrade?

import { sleep } from 'k6';
import { TEST_CONFIG, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.stress,  // More lenient thresholds for stress testing
  scenarios: {
    'nested-data': TEST_CONFIG.stress.nested,
  },
};

// GraphQL query for fetching events with their ticket batches (nested data)
const QUERY = `
  query GetEventsWithTicketBatches {
    events(first: 10) {
      nodes {
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
  }
`;

export default function () {
  const response = graphqlQuery(QUERY);
  checkGraphQLResponse(response);
  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - GraphQL Stress Test');
  console.log('Testing: events with ticketBatches query (DataLoader batching)');
  console.log('Expected: 1 HTTP request with batched DB queries');
  console.log('Configuration: shared-iterations, 50 VUs, 10000 iterations (stress test)');
  console.log('Goal: Find breaking point and measure degradation');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (GraphQL Stress) completed');
}

export { handleSummary };

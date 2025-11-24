// k6/scenarios/02-nested-data/spike-graphql.js
// Scenario 2: Nested Data - GraphQL Spike Test
// Sudden traffic burst to test elasticity and recovery
//
// Purpose: Test how system handles sudden traffic spikes and recovers
// Pattern: Normal load → SUDDEN SPIKE to 200 VUs → back to normal
// Key Metric: Can GraphQL handle sudden burst without cascading failures?

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.spike,  // Allow some errors during spike
  scenarios: {
    'nested-data': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.spike,
    },
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
  console.log('Starting Scenario 2: Nested Data - GraphQL Spike Test');
  console.log('Testing: Sudden traffic burst (20 → 200 → 20 VUs)');
  console.log('Duration: 2 minutes with 1-minute spike');
  console.log('Goal: Measure elasticity and recovery from sudden load');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 (GraphQL Spike) completed');
}

export { handleSummary };

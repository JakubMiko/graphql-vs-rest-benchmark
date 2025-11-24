// k6/after_optimization/scenarios/02-nested-data/spike-graphql.js
// Scenario 2: Nested Data - GraphQL Spike Test (OPTIMIZED PHASE)
// Sudden traffic spike to 200 VUs - tests elasticity and cache behavior under burst load
//
// Key Metric: Can the system handle sudden traffic bursts with caching?
// Expected: Cache should absorb most of the spike if data is already cached

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.spike,
  scenarios: {
    'nested-data-spike': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.spike,
    },
  },
};

// GraphQL query with Connection type
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
      totalCount
    }
  }
`;

export default function () {
  const response = graphqlQuery(QUERY);
  checkGraphQLResponse(response);
  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - GraphQL Spike Test (OPTIMIZED)');
  console.log('Testing: Sudden traffic spike with Redis caching');
  console.log('Goal: Measure cache effectiveness during burst traffic');
  console.log('Target: Spike from 10 → 200 VUs instantly');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 Spike Test (GraphQL OPTIMIZED) completed');
  console.log('Check if cache absorbed the spike effectively');
}

export { handleSummary };

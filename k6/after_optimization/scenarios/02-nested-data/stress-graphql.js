// k6/after_optimization/scenarios/02-nested-data/stress-graphql.js
// Scenario 2: Nested Data - GraphQL Stress Test (OPTIMIZED PHASE)
// Find breaking point by ramping up to 200 VUs - tests scalability with optimizations
//
// Key Metric: At what load does GraphQL nested query performance degrade?
// With optimizations: Caching should delay degradation, higher breaking point expected

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
export const options = {
  thresholds: THRESHOLDS.stress,
  scenarios: {
    'nested-data-stress': {
      executor: 'ramping-vus',
      stages: TEST_STAGES.stress,
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
  console.log('Starting Scenario 2: Nested Data - GraphQL Stress Test (OPTIMIZED)');
  console.log('Testing: events with ticketBatches query (DataLoader + Caching)');
  console.log('Goal: Find breaking point with cache layer');
  console.log('Target: Ramp from 0 → 200 VUs over 10 minutes');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 Stress Test (GraphQL OPTIMIZED) completed');
  console.log('Review p95/p99 latencies to identify breaking point');
}

export { handleSummary };

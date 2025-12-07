// k6/scenarios/04-selective-fields/load-graphql.js
// Scenario 4: Selective Fields - GraphQL Load Test
// Fetch events with ONLY selected fields (id, name) - tests GraphQL's ability to return exactly what's requested
//
// This demonstrates GraphQL's selective field fetching vs REST's over-fetching.
// GraphQL returns only the 2 requested fields, while REST returns all ~10 fields.

import { TEST_CONFIG, THRESHOLDS } from '../../../config.js';
import { graphqlQuery, checkGraphQLResponse } from '../../../helpers.js';
import { handleSummary } from '../../../summary.js';

// Test configuration
// Note: Tags (api, phase, scenario) are added via CLI by run-test.sh
export const options = {
  thresholds: THRESHOLDS.phase1_comparison,
  // Use shared-iterations executor for fair comparison
  scenarios: {
    'selective-fields': TEST_CONFIG.phase1_comparison.selective_fields,
  },
};

// GraphQL query requesting ONLY id and name fields (2 out of ~10 available fields)
// This is the key difference: we explicitly request only what we need
// Limiting to 20 events (realistic first page size)
// Note: GraphQL uses Relay-style connections (edges/node structure)
const QUERY = `
  query GetEventsMinimal {
    events(first: 20) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

export default function () {
  // Execute query - GraphQL will return ONLY the requested fields
  const response = graphqlQuery(QUERY);

  // Validate response
  checkGraphQLResponse(response);
}

// Setup function (runs once at the start)
export function setup() {
  console.log('Starting Scenario 4: Selective Fields - GraphQL Load Test');
  console.log('Testing: events query with selective fields (id, name only)');
  console.log('Expected: Minimal data transfer, only requested fields returned');
  console.log('Configuration: shared-iterations, 20 VUs, 10000 iterations');
  return {};
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Scenario 4 (GraphQL) completed');
  console.log('Check data_received metric - should be 60-80% less than REST');
}

// Export the custom summary handler
export { handleSummary };

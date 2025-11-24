// k6/after_optimization/scenarios/02-nested-data/spike-rest.js
// Scenario 2: Nested Data - REST Spike Test (OPTIMIZED PHASE)
// Sudden traffic spike to 200 VUs - tests elasticity and cache behavior under burst load
//
// Key Metric: Can the system handle sudden traffic bursts with HTTP caching?
// Expected: Cache hits should help absorb some of the spike for repeated requests

import { sleep } from 'k6';
import { TEST_STAGES, THRESHOLDS, SLEEP_DURATION } from '../../../config.js';
import { restRequest, checkResponse } from '../../../helpers.js';
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

export default function () {
  // Fetch events with pagination
  const eventsResponse = restRequest('GET', '/events?page=1&per_page=10');
  checkResponse(eventsResponse, 200, 'events fetched successfully');

  if (eventsResponse.status === 200) {
    const eventsData = JSON.parse(eventsResponse.body);
    const events = eventsData.data || eventsData.events || [];

    // Fetch ticket_batches for each event (N+1 problem)
    events.forEach((event) => {
      const ticketBatchesResponse = restRequest('GET', `/events/${event.id}/ticket_batches`);
      checkResponse(ticketBatchesResponse, 200, `ticket_batches fetched for event ${event.id}`);
    });
  }

  sleep(SLEEP_DURATION.between_requests);
}

export function setup() {
  console.log('Starting Scenario 2: Nested Data - REST Spike Test (OPTIMIZED)');
  console.log('Testing: Sudden traffic spike with HTTP caching');
  console.log('Goal: Measure cache effectiveness during burst traffic');
  console.log('Target: Spike from 10 → 200 VUs instantly');
  return {};
}

export function teardown(data) {
  console.log('Scenario 2 Spike Test (REST OPTIMIZED) completed');
  console.log('Check if HTTP caching helped absorb the spike');
}

export { handleSummary };

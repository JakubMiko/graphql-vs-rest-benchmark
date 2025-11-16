// k6/config.js
// Shared configuration for all k6 tests

export const API_ENDPOINTS = {
  graphql: 'http://eventql:3000/graphql',
  rest: 'http://event-rest:3000/api/v1',
};

// Test stage configurations
export const TEST_STAGES = {
  load: [
    { duration: '1m', target: 50 },   // Ramp up to 50 VUs
    { duration: '3m', target: 50 },   // Hold at 50 VUs (plateau)
    { duration: '1m', target: 0 },    // Ramp down
  ],

  stress: [
    { duration: '2m', target: 50 },   // Normal
    { duration: '3m', target: 100 },  // Stress
    { duration: '3m', target: 200 },  // High stress
    { duration: '2m', target: 0 },    // Recovery
  ],

  spike: [
    { duration: '30s', target: 20 },  // Normal
    { duration: '1m', target: 200 },  // SPIKE!
    { duration: '30s', target: 20 },  // Back to normal
  ],

  soak: [
    { duration: '5m', target: 50 },   // Ramp up
    { duration: '110m', target: 50 }, // Sustained load (1h 50m)
    { duration: '5m', target: 0 },    // Cool down
  ],
};

// Common thresholds
export const THRESHOLDS = {
  load: {
    'http_req_duration': ['p(95)<500'],      // 95% of requests < 500ms
    'http_req_failed': ['rate<0.01'],        // Error rate < 1%
  },

  stress: {
    // No hard thresholds - just measure degradation
    'http_req_duration': ['p(95)<2000'],     // More lenient
  },

  spike: {
    'http_req_failed': ['rate<0.05'],        // Allow 5% errors during spike
  },

  soak: {
    'http_req_duration': ['p(95)<500'],      // Should maintain performance
    'http_req_failed': ['rate<0.01'],        // Error rate should stay low
  },
};

// Sample test data
export const TEST_DATA = {
  categories: ['music', 'sports', 'theater', 'conference', 'festival'],
  places: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
};

// Headers
export const HEADERS = {
  json: {
    'Content-Type': 'application/json',
  },
};

// Sleep durations (in seconds)
export const SLEEP_DURATION = {
  between_requests: 1,
  between_iterations: 2,
};

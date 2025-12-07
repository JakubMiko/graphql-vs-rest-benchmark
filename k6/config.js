// k6/config.js
// Shared configuration for all k6 tests

export const API_ENDPOINTS = {
  graphql: 'http://eventql:3000/graphql',
  rest: 'http://event-rest:3000/api/v1',
};

// ============================================================================
// TEST CONFIGURATIONS - Phase 1 Comparison (shared-iterations)
// ============================================================================

export const TEST_CONFIG = {
  phase1_comparison: {
    // Scenario 1: Simple Read
    simple_read: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: 10000,
      maxDuration: '10m',
    },

    // Scenario 2: Nested Data
    nested_data: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: 8000,
      maxDuration: '10m',
    },

    // Scenario 3: Selective Fields
    selective_fields: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: 10000,
      maxDuration: '10m',
    },

    // Scenario 4: Write Operations
    write_operations: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: 10000,
      maxDuration: '10m',
    },

    // Scenario 5: Concurrent Users
    concurrent_users: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: 3000,
      maxDuration: '20m',
    },
  },
};

// Common thresholds
export const THRESHOLDS = {
  phase1_comparison: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],
  },

  load: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },

  stress: {
    'http_req_duration': ['p(95)<2000'],
  },

  spike: {
    'http_req_failed': ['rate<0.05'],
  },

  soak: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
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

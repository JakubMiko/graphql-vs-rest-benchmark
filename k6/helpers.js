// k6/helpers.js
// Utility functions for k6 tests

import http from 'k6/http';
import { check } from 'k6';
import { API_ENDPOINTS, HEADERS } from './config.js';

/**
 * Execute a GraphQL query
 * @param {string} query - GraphQL query string
 * @param {object} variables - Query variables
 * @param {string} token - Optional auth token
 * @returns {object} Response object
 */
export function graphqlQuery(query, variables = {}, token = null) {
  const headers = { ...HEADERS.json };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const payload = JSON.stringify({
    query: query,
    variables: variables,
  });

  return http.post(API_ENDPOINTS.graphql, payload, { headers });
}

/**
 * Make a REST API request
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} endpoint - API endpoint path
 * @param {object} body - Request body
 * @param {string} token - Optional auth token
 * @returns {object} Response object
 */
export function restRequest(method, endpoint, body = null, token = null) {
  const headers = { ...HEADERS.json };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_ENDPOINTS.rest}${endpoint}`;

  const params = { headers };

  switch (method.toUpperCase()) {
    case 'GET':
      return http.get(url, params);
    case 'POST':
      return http.post(url, JSON.stringify(body), params);
    case 'PUT':
      return http.put(url, JSON.stringify(body), params);
    case 'DELETE':
      return http.del(url, null, params);
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

/**
 * Login to GraphQL API and get auth token
 * @param {string} email
 * @param {string} password
 * @returns {string|null} Auth token or null if login failed
 */
export function loginGraphQL(email, password) {
  const query = `
    mutation Login($email: String!, $password: String!) {
      login(input: { email: $email, password: $password }) {
        token
        user {
          id
          email
        }
        errors
      }
    }
  `;

  const response = graphqlQuery(query, { email, password });

  if (check(response, { 'login successful': (r) => r.status === 200 })) {
    const data = JSON.parse(response.body);
    return data.data?.login?.token || null;
  }

  return null;
}

/**
 * Login to REST API and get auth token
 * @param {string} email
 * @param {string} password
 * @returns {string|null} Auth token or null if login failed
 */
export function loginREST(email, password) {
  const response = restRequest('POST', '/users/login', {
    email: email,
    password: password,
  });

  if (check(response, { 'login successful': (r) => r.status === 200 })) {
    const data = JSON.parse(response.body);
    return data.token || null;
  }

  return null;
}

/**
 * Generate random test data
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement(array) {
  return array[randomInt(0, array.length - 1)];
}

export function randomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

/**
 * Standard checks for API responses
 */
export function checkResponse(response, expectedStatus = 200, checkName = 'request successful') {
  return check(response, {
    [checkName]: (r) => r.status === expectedStatus,
    'response has body': (r) => r.body && r.body.length > 0,
    'response time OK': (r) => r.timings.duration < 2000, // Less than 2 seconds
  });
}

/**
 * Check GraphQL response for errors
 */
export function checkGraphQLResponse(response) {
  const baseChecks = checkResponse(response, 200);

  const additionalChecks = check(response, {
    'no GraphQL errors': (r) => {
      const body = JSON.parse(r.body);
      return !body.errors || body.errors.length === 0;
    },
    'has data field': (r) => {
      const body = JSON.parse(r.body);
      return body.data !== undefined;
    },
  });

  return baseChecks && additionalChecks;
}

/**
 * Create a test user (for write tests)
 */
export function createTestUser(api = 'graphql') {
  const timestamp = Date.now();
  const email = `test${timestamp}@benchmark.com`;
  const password = 'TestPassword123!';

  if (api === 'graphql') {
    const query = `
      mutation CreateUser($email: String!, $password: String!) {
        createUser(input: { email: $email, password: $password }) {
          user {
            id
            email
          }
          errors
        }
      }
    `;

    const response = graphqlQuery(query, { email, password });

    if (checkGraphQLResponse(response)) {
      return { email, password };
    }
  } else {
    const response = restRequest('POST', '/users', {
      email: email,
      password: password,
    });

    if (checkResponse(response, 201)) {
      return { email, password };
    }
  }

  return null;
}

/**
 * Metrics helper - log custom metrics
 */
export function logMetric(name, value, tags = {}) {
  console.log(JSON.stringify({
    metric: name,
    value: value,
    tags: tags,
    timestamp: new Date().toISOString(),
  }));
}

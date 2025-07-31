// src/response.js

/**
 * Creates a successful response with optional data
 */
function createSuccessResponse(data = {}) {
  return {
    status: 'ok',
    ...data,
  };
}

/**
 * Creates an error response with a given status code and message
 */
function createErrorResponse(code = 500, message = 'Internal Server Error') {
  return {
    status: 'error',
    error: {
      code,
      message,
    },
  };
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
};

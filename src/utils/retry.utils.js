/**
 * Retry utility with exponential backoff.
 * Useful for transient failures in external API calls.
 */

/**
 * Retries an async function with exponential backoff.
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry configuration
 * @param {number} options.maxAttempts - Max retry attempts (default: 3)
 * @param {number} options.baseDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay cap in ms (default: 10000)
 * @param {string} options.name - Operation name for logging (default: 'Operation')
 * @param {Function} options.shouldRetry - Custom predicate to check if error is retryable (default: retries on 5xx/network errors)
 * @returns {Promise} - Result of the function call
 * @throws {Error} - Last error if all retries exhausted
 */
async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    name = 'Operation',
    shouldRetry = isRetryableError
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Log the attempt
      if (attempt === 0) {
        console.log(`[${name}] Starting...`);
      } else {
        console.log(`[${name}] Retry attempt ${attempt}/${maxAttempts - 1}`);
      }

      // Execute the function
      const result = await fn();
      console.log(`[${name}] Success`);
      return result;
    } catch (error) {
      lastError = error;

      // Check if the error is retryable
      if (!shouldRetry(error)) {
        console.error(`[${name}] Non-retryable error: ${error.message}`);
        throw error;
      }

      // Calculate exponential backoff delay
      // delay = min(baseDelay * (2 ^ attempt), maxDelay)
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const delay = Math.min(exponentialDelay, maxDelay);

      // If this is the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        console.error(`[${name}] Failed after ${maxAttempts} attempts: ${error.message}`);
        throw error;
      }

      // Log the retry delay
      console.warn(`[${name}] Retrying in ${delay}ms after error: ${error.message}`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Determines if an error is retryable.
 * Retries on network errors and 5xx server errors.
 * Does NOT retry on 4xx client errors (bad request, unauthorized, etc.).
 *
 * @param {Error} error - The error to check
 * @returns {boolean} - True if the error is retryable
 */
function isRetryableError(error) {
  // Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
  if (!error.response) {
    return true;
  }

  // 5xx server errors are retryable
  if (error.response.status >= 500 && error.response.status < 600) {
    return true;
  }

  // 429 Too Many Requests is retryable
  if (error.response.status === 429) {
    return true;
  }

  // 4xx client errors are NOT retryable (except 429)
  return false;
}

module.exports = {
  withRetry,
  isRetryableError
};

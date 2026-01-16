import delay from 'utils/js/delay'
import Logger from 'utils/Logger'

const DEFAULT_MAX_RETRIES = 10

type RetryParams<T> = {
  operation: (retryIndex: number) => Promise<T>
  shouldStop: (result: T) => boolean
  maxRetries?: number
  backoffPolicy?: RetryBackoffPolicyInterface
}

/*
 * Retries an operation with defined backoff policy.
 *
 * @param operation - The operation to retry.
 * @param shouldStop - The predicate to check if the operation should stop retrying.
 * @param maxRetries - The maximum number of retries.
 * @param backoffPolicy - Function to generate delay time based on current retry count.
 *
 * @returns The result of the operation.
 * @throws An error if the operation fails after the maximum number of retries.
 *
 * @example
 *   const result = await retry(
 *     async () => {
 *       const response = await fetch('https://example.com')
 *       return response.json()
 *     },
 *     result => result.status === 200
 *   )
 */
export const retry = async <T>({
  operation,
  shouldStop,
  maxRetries = DEFAULT_MAX_RETRIES,
  backoffPolicy = RetryBackoffPolicy.exponential()
}: RetryParams<T>): Promise<T> => {
  let backoffPeriodMillis = 0
  let retries = 0
  let lastError: unknown

  while (retries < maxRetries) {
    if (retries > 0) {
      Logger.info(`retry in ${backoffPeriodMillis} millis`)
      Logger.info(`retry count: ${retries}`)
      await delay(backoffPeriodMillis)
    }

    try {
      const result = await operation(retries)

      if (shouldStop(result)) {
        return result
      }
    } catch (err) {
      // when the operation throws an error, we still retry
      lastError = err
      Logger.error('operation failed', err)
    }

    backoffPeriodMillis = backoffPolicy(retries)
    retries++
  }

  const errorMessage = lastError
    ? `Max retry exceeded. ${lastError}`
    : 'Max retry exceeded.'

  throw new Error(errorMessage)
}

type RetryBackoffPolicyInterface = (retryIndex: number) => number

export class RetryBackoffPolicy {
  static exponential(): RetryBackoffPolicyInterface {
    return (retryIndex: number): number => {
      return Math.pow(2, retryIndex) * 1000
    }
  }

  static constant(secondsToDelay: number): RetryBackoffPolicyInterface {
    return (_: number): number => {
      return secondsToDelay * 1000
    }
  }

  static constantMs(msToDelay: number): RetryBackoffPolicyInterface {
    return (_: number): number => {
      return msToDelay
    }
  }

  /**
   * linearThenExponential backoff:
   * - First `linearCount` retries: linear increase by `linearStepMs`
   * - After that: increment grows exponentially based on `linearStepMs`
   *   Example (linearCount=4, linearStepMs=1000):
   *     1s, 2s, 3s, 4s, 6s, 10s, 18s, 34s...
   */
  static linearThenExponential(
    linearCount: number,
    linearStepMs: number
  ): RetryBackoffPolicyInterface {
    return (retryIndex: number): number => {
      if (retryIndex < linearCount) {
        // Linear phase: (i+1) * step
        return (retryIndex + 1) * linearStepMs
      }
      // Exponential-increment phase (closed form):
      // n = number of exponential increments applied
      // base = linearCount * step
      // increment sum = 2*step * (2^n - 1)
      const n = retryIndex - linearCount + 1
      const base = linearCount * linearStepMs
      const incSum = 2 * linearStepMs * (Math.pow(2, n) - 1)
      return base + incSum
    }
  }
}

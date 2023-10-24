import delay from 'utils/js/delay'
import Logger from 'utils/Logger'

const DEFAULT_MAX_RETRIES = 10

type RetryParams<T> = {
  operation: (retryIndex: number) => Promise<T>
  isSuccess: (result: T) => boolean
  maxRetries?: number
  backoffPolicy?: RetryBackoffPolicyInterface
}

/*
 * Retries an operation with defined backoff policy.
 *
 * @param operation - The operation to retry.
 * @param isSuccess - The predicate to check if the operation succeeded.
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
  isSuccess,
  maxRetries = DEFAULT_MAX_RETRIES,
  backoffPolicy = RetryBackoffPolicy.exponential()
}: RetryParams<T>): Promise<T> => {
  let backoffPeriodSeconds = 0
  let retries = 0
  let lastError: unknown

  while (retries < maxRetries) {
    if (retries > 0) {
      Logger.info(`retry in ${backoffPeriodSeconds} seconds`)
      Logger.info(`retry count: ${retries}`)
      await delay(backoffPeriodSeconds * 1000)
    }

    try {
      const result = await operation(retries)

      if (isSuccess(result)) {
        return result
      }
    } catch (err) {
      // when the operation throws an error, we still retry
      lastError = err
      Logger.error('operation failed', err)
    }

    backoffPeriodSeconds = backoffPolicy(retries)
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
      return Math.pow(2, retryIndex)
    }
  }
  static constant(secondsToDelay: number): RetryBackoffPolicyInterface {
    return (_: number): number => {
      return secondsToDelay
    }
  }
}

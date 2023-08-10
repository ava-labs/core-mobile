import delay from 'utils/js/delay'
import Logger from 'utils/Logger'

const DEFAULT_MAX_RETRIES = 10

type RetryParams<T> = {
  operation: () => Promise<T>
  isSuccess: (result: T) => boolean
  maxRetries?: number
}

/*
 * Retries an operation with exponential backoff.
 *
 * @param operation - The operation to retry.
 * @param isSuccess - The predicate to check if the operation succeeded.
 * @param maxRetries - The maximum number of retries.
 *
 * @returns The result of the operation.
 * @throws An error if the operation fails after the maximum number of retries.
 *
 * @example
 *   const result = await retryWithExponentialBackoff(
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
  maxRetries = DEFAULT_MAX_RETRIES
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
      const result = await operation()

      if (isSuccess(result)) {
        return result
      }
    } catch (err) {
      // when the operation throws an error, we still retry
      lastError = err
      Logger.error('operation failed', err)
    }

    backoffPeriodSeconds = Math.pow(2, retries)
    retries++
  }

  const errorMessage = lastError
    ? `Max retry exceeded. ${lastError}`
    : 'Max retry exceeded.'

  throw new Error(errorMessage)
}

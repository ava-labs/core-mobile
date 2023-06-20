import delay from 'utils/js/delay'
import Logger from 'utils/Logger'

const INFINITE = 0

export async function exponentialBackoff<T>(
  f: () => Promise<T>,
  resultAccepted: (result: T) => boolean,
  maxRetries = INFINITE
): Promise<T> {
  let backoffPeriodSeconds = 0
  let counter = 0
  let result: T
  do {
    Logger.trace('backing off', backoffPeriodSeconds)
    await delay(backoffPeriodSeconds * 1000)
    result = await f()
    backoffPeriodSeconds = Math.pow(2, counter)
    counter++
  } while (!resultAccepted(result) || counter === maxRetries)

  if (counter === maxRetries) {
    throw new Error('Max retry exceeded.')
  }

  return result
}

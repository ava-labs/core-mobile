import { ErrorBase } from 'errors/ErrorBase'

export class TimeoutError extends ErrorBase<'TIMEOUT_ERROR'> {}

/**
 * If param **promise** does not resolve within **ms** this promise will throw **timeoutError**.
 * You can catch error thrown in try catch block and check against **timeoutError** if throw was
 * because of timeout or coming from wrapped **promise**
 *
 * @param promise Promise to race against
 * @param ms Timeout in milliseconds
 */
export default function promiseWithTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    promise,
    new Promise<T>(
      (_r, reject) =>
        (timer = setTimeout(
          reject,
          ms,
          new TimeoutError({
            message: 'Promise timed out!',
            name: 'TIMEOUT_ERROR'
          })
        ))
    )
  ]).finally(() => timer && clearTimeout(timer))
}

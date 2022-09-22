import { OptimalRate } from 'paraswap-core'

export async function incrementalPromiseResolve<T>(
  prom: () => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorParser: (res: any) => boolean,
  increment = 0,
  maxTries = 10
): Promise<T> {
  const res = await incrementAndCall(prom(), Math.pow(2, increment))
  if (maxTries === increment) {
    return res
  }
  if (errorParser(res)) {
    return incrementalPromiseResolve(() => prom(), errorParser, increment + 1)
  }
  return res
}

function incrementAndCall<T>(prom: Promise<T>, interval = 0) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  return new Promise<T>(resolve => {
    setTimeout(() => {
      prom.then(res => resolve(res))
    }, 500 * interval)
  })
}

export function resolve<T>(promise: Promise<T>) {
  try {
    return promise.then(res => [res, null]).catch(err => [null, err])
  } catch (err) {
    return Promise.resolve([null, err])
  }
}

export const calculateRate = (optimalRate: OptimalRate) => {
  const { destAmount, destDecimals, srcAmount, srcDecimals } = optimalRate
  const destAmountNumber = parseInt(destAmount) / Math.pow(10, destDecimals)
  const sourceAmountNumber = parseInt(srcAmount) / Math.pow(10, srcDecimals)
  return destAmountNumber / sourceAmountNumber
}

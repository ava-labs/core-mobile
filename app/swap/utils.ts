import { TokenType, TokenWithBalance } from 'store/balance'

// @ts-ignore generic - ts complains about returning `any`
export async function incrementalPromiseResolve<T>(
  prom: () => Promise<T>,
  errorParser: (res: any) => boolean,
  increment = 0,
  maxTries = 10
) {
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
  return new Promise(resolve => {
    setTimeout(() => {
      prom.then(res => resolve(res))
    }, 500 * interval)
  })
}

export function getSrcToken(token: TokenWithBalance) {
  if (token.type === TokenType.ERC20) {
    return token.address
  }
  return token.symbol
}

export function resolve<T = any>(promise: Promise<T>) {
  try {
    return promise.then(res => [res, null]).catch(err => [null, err])
  } catch (err) {
    return Promise.resolve([null, err])
  }
}

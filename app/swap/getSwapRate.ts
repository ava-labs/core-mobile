import {WalletType} from '@avalabs/avalanche-wallet-sdk';
import {
  ERC20,
  TokenWithBalance,
  wallet$,
} from '@avalabs/wallet-react-components';
import {APIError, ParaSwap, SwapSide} from 'paraswap';
import {OptimalRate} from 'paraswap-core';
import {firstValueFrom} from 'rxjs';
import {paraSwap$} from './swap';

const SERVER_BUSY_ERROR = 'Server too busy';

export async function getSwapRate(request: {
  srcToken?: TokenWithBalance;
  destToken?: TokenWithBalance;
  srcDecimals?: number;
  destDecimals?: number;
  srcAmount?: string;
}) {
  const {srcToken, destToken, srcDecimals, destDecimals, srcAmount} =
    request || [];

  if (!srcToken) {
    return {
      ...request,
      error: 'no source token on request',
    };
  }

  if (!destToken) {
    return {
      ...request,
      error: 'no destination token on request',
    };
  }

  if (!srcAmount) {
    return {
      ...request,
      error: 'no amount on request',
    };
  }

  if (!srcDecimals) {
    return {
      ...request,
      error: 'request requires the decimals for source token',
    };
  }

  if (!destDecimals) {
    return {
      ...request,
      error: 'request requires the decimals for destination token',
    };
  }

  const [paraSwap, err] = await resolve(firstValueFrom(paraSwap$));
  const [wallet, walletError] = await resolve(firstValueFrom(wallet$));

  if (err) {
    return {
      ...request,
      error: err,
    };
  }

  if (walletError) {
    return {
      ...request,
      error: walletError,
    };
  }

  const optimalRates = (paraSwap as ParaSwap).getRate(
    getSrcToken(srcToken),
    getSrcToken(destToken),
    srcAmount,
    (wallet as WalletType).getAddressC(),
    SwapSide.SELL,
    {
      partner: 'Avalanche',
    },
    srcDecimals,
    destDecimals,
  );

  function checkForErrorsInResult(result: OptimalRate | APIError) {
    return (result as APIError).message === SERVER_BUSY_ERROR;
  }

  const result = await incrementalPromiseResolve(
    () => optimalRates,
    checkForErrorsInResult,
  );

  return {
    result,
  };
}

export function resolve<T = any>(promise: Promise<T>) {
  try {
    return promise.then(res => [res, null]).catch(err => [null, err]);
  } catch (err) {
    return Promise.resolve([null, err]);
  }
}

async function incrementalPromiseResolve<T>(
  prom: () => Promise<T>,
  errorParser: (res: any) => boolean,
  increment = 0,
  maxTries = 10,
) {
  const res = await incrementAndCall(prom(), 0);
  if (maxTries === increment) {
    return res;
  }
  if (errorParser(res)) {
    return incrementalPromiseResolve(() => prom(), errorParser, increment + 1);
  }
  return res;
}

function incrementAndCall<T>(prom: Promise<T>, interval = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      prom.then(res => resolve(res));
    }, 500 * interval);
  });
}

function getSrcToken(token: TokenWithBalance) {
  if (token.isErc20) {
    return (token as ERC20).address;
  }
  return token.symbol;
}

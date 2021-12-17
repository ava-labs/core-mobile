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
import {getDecimalsForEVM} from 'utils/TokenTools';

const SERVER_BUSY_ERROR = 'Server too busy';

export async function getSwapRate(request: {
  srcToken?: TokenWithBalance;
  destToken?: TokenWithBalance;
  amount?: string;
  swapSide: SwapSide;
}) {
  const {srcToken, destToken, amount, swapSide} = request || [];

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

  if (!amount) {
    return {
      ...request,
      error: 'no amount on request',
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
    amount,
    (wallet as WalletType).getAddressC(),
    swapSide,
    {
      partner: 'Avalanche',
    },
    getDecimalsForEVM(srcToken),
    getDecimalsForEVM(destToken),
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
  const res = await incrementAndCall(prom(), Math.pow(2, increment));
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

import {APIError, ParaSwap} from 'paraswap';
import {firstValueFrom} from 'rxjs';
import {paraSwap$} from 'swap/swap';
import {GasPrice} from 'utils/GasPriceHook';
import {WalletType} from '@avalabs/avalanche-wallet-sdk';
import Web3 from 'web3';
import ERC20_ABI from '../contracts/erc20.abi.json';
import {Allowance} from 'paraswap/build/types';
import {OptimalRate} from 'paraswap-core';
import {incrementalPromiseResolve, resolve} from 'swap/utils';

const SERVER_BUSY_ERROR = 'Server too busy';

export async function performSwap(
  request: {
    srcAmount?: string;
    destAmount?: string;
    priceRoute?: OptimalRate;
    gasLimit?: any;
    gasPrice?: GasPrice;
  },
  wallet?: WalletType,
) {
  console.log('~~~~~~~~~ perform swap');
  const {srcAmount, destAmount, priceRoute, gasLimit, gasPrice} = request;
  console.log('~~~~~~~~~ srcAmount', srcAmount);
  console.log('~~~~~~~~~ destAmount', destAmount);
  console.log('~~~~~~~~~ priceRoute', priceRoute);
  console.log('~~~~~~~~~ gasLimit', gasLimit);
  console.log('~~~~~~~~~ gasPrice', gasPrice);

  if (!priceRoute) {
    return {
      error: 'request requires the paraswap priceRoute',
    };
  }

  if (!wallet) {
    return {
      error: 'no wallet on request',
    };
  }

  if (!srcAmount) {
    return {
      error: 'no amount on request',
    };
  }

  if (!destAmount) {
    return {
      error: 'no amount on request',
    };
  }

  if (!gasLimit) {
    return {
      error: 'request requires gas limit from paraswap response',
    };
  }

  const [paraSwap, err] = await resolve(firstValueFrom(paraSwap$));

  if (err) {
    return {
      error: `Paraswap Init Error: ${err}`,
    };
  }

  const pSwap = paraSwap as ParaSwap;

  const buildOptions = undefined,
    partnerAddress = undefined,
    partner = 'Avalanche',
    userAddress = (wallet as WalletType).getAddressC(),
    receiver = undefined,
    permit = undefined,
    deadline = undefined,
    partnerFeeBps = undefined;

  console.log('~~~~~~~~~ userAddress', userAddress);
  console.log('~~~~~~~~~ partner', partner);
  const spender = await pSwap.getTokenTransferProxy();
  console.log('~~~~~~~~~ spender', spender);

  const contract = new (pSwap.web3Provider as Web3).eth.Contract(
    ERC20_ABI as any,
    priceRoute.srcToken,
  );
  console.log('~~~~~~~~~ contract', contract);

  const [allowance, allowanceError] = await resolve(
    pSwap.getAllowance(userAddress, priceRoute.srcToken),
  );
  console.log('~~~~~~~~~allowance', allowance);
  console.log('~~~~~~~~~allowanceError', allowanceError);
  if (
    allowanceError ||
    (!!(allowance as APIError).message &&
      (allowance as APIError).message !== 'Not Found')
  ) {
    return {
      error: `Allowance Error: ${
        allowanceError ?? (allowance as APIError).message
      }`,
    };
  }

  const [approveTxHash, approveError] = await resolve(
    /**
     * We may need to check if the allowance is enough to cover what is trying to be sent?
     */
    (allowance as Allowance).tokenAddress
      ? (Promise.resolve([]) as any)
      : (wallet as WalletType).sendCustomEvmTx(
          (gasPrice as GasPrice).bn,
          Number(gasLimit),
          contract.methods.approve(spender, srcAmount).encodeABI(),
          priceRoute.srcToken,
        ),
  );
  console.log('~~~~~~~~~approveTxHash', approveTxHash);
  console.log('~~~~~~~~~approveError', approveError);

  if (approveError) {
    return {
      error: `Approve Error: ${approveError}`,
    };
  }

  const txData = pSwap.buildTx(
    priceRoute.srcToken,
    priceRoute.destToken,
    srcAmount,
    destAmount,
    priceRoute,
    userAddress,
    partner,
    partnerAddress,
    partnerFeeBps,
    receiver,
    buildOptions,
    priceRoute.srcDecimals,
    priceRoute.destDecimals,
    permit,
    deadline,
  );
  console.log('~~~~~~~~~txData', txData);

  function checkForErrorsInResult(result: OptimalRate | APIError) {
    return (result as APIError).message === SERVER_BUSY_ERROR;
  }

  const [txBuildData, txBuildDataError] = await resolve(
    incrementalPromiseResolve(() => txData, checkForErrorsInResult),
  );
  console.log('~~~~~~~~~txBuildData', txBuildData);
  console.log('~~~~~~~~~txBuildDataError', txBuildDataError);

  if ((txBuildData as APIError).message) {
    return {
      error: (txBuildData as APIError).message,
    };
  }
  if (txBuildDataError) {
    return {
      error: `Data Error: ${txBuildDataError}`,
    };
  }

  const [swapTxHash, txError] = await resolve(
    (wallet as WalletType).sendCustomEvmTx(
      (gasPrice as GasPrice).bn,
      Number(txBuildData.gas),
      txBuildData.data,
      txBuildData.to,
    ),
  );
  console.log('~~~~~~~~~swapTxHash', swapTxHash);
  console.log('~~~~~~~~~txError', txError);

  if (txError) {
    return {
      error: `Tx Error: ${txError}`,
    };
  }

  return {
    result: {
      swapTxHash,
      approveTxHash,
    },
  };
}

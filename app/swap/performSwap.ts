import {
  ERC20,
  TokenWithBalance,
  wallet$,
} from '@avalabs/wallet-react-components';
import {APIError, ParaSwap} from 'paraswap';
import {firstValueFrom} from 'rxjs';
import {paraSwap$} from 'swap/swap';
import {GasPrice} from 'utils/GasPriceHook';
import {WalletType} from '@avalabs/avalanche-wallet-sdk';
import Web3 from 'web3';
import ERC20_ABI from '../contracts/erc20.abi.json';
import {Allowance} from 'paraswap/build/types';
import {getDecimalsForEVM} from 'utils/TokenTools';
import {OptimalRate} from 'paraswap-core';
import {getSrcToken, incrementalPromiseResolve, resolve} from 'swap/utils';

const SERVER_BUSY_ERROR = 'Server too busy';

export async function performSwap(request: {
  srcToken?: TokenWithBalance;
  destToken?: TokenWithBalance;
  srcAmount?: string;
  destAmount?: string;
  priceRoute: any;
  gasLimit: any;
  gasPrice: GasPrice;
}) {
  const {
    srcToken,
    destToken,
    srcAmount,
    destAmount,
    priceRoute,
    gasLimit,
    gasPrice,
  } = request;

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

  if (!destAmount) {
    return {
      ...request,
      error: 'no amount on request',
    };
  }

  if (!priceRoute) {
    return {
      ...request,
      error: 'request requires the paraswap priceRoute',
    };
  }

  if (!gasLimit) {
    return {
      ...request,
      error: 'request requires gas limit from paraswap response',
    };
  }

  const [paraSwap, err] = await resolve(firstValueFrom(paraSwap$));
  const [wallet, walletError] = await resolve(firstValueFrom(wallet$));

  if (err) {
    return {
      ...request,
      error: `Paraswap Init Error: ${err}`,
    };
  }

  const pSwap = paraSwap as ParaSwap;

  if (walletError) {
    return {
      ...request,
      error: `Wallet Error: ${walletError}`,
    };
  }

  const buildOptions = undefined,
    partnerAddress = undefined,
    partner = 'Avalanche',
    userAddress = (wallet as WalletType).getAddressC(),
    receiver = undefined,
    permit = undefined,
    deadline = undefined,
    partnerFeeBps = undefined;

  const spender = await pSwap.getTokenTransferProxy();

  const contract = new (pSwap.web3Provider as Web3).eth.Contract(
    ERC20_ABI as any,
    (srcToken as ERC20).address, //fixme
  );

  const [allowance, allowanceError] = await resolve(
    pSwap.getAllowance(userAddress, (srcToken as ERC20).address), //fixme
  );

  if (
    allowanceError ||
    (!!(allowance as APIError).message &&
      (allowance as APIError).message !== 'Not Found')
  ) {
    return {
      ...request,
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
          (srcToken as ERC20).address, //fixme
        ),
  );

  if (approveError) {
    return {
      ...request,
      error: `Approve Error: ${approveError}`,
    };
  }

  const txData = pSwap.buildTx(
    getSrcToken(srcToken),
    getSrcToken(destToken),
    srcAmount,
    destAmount,
    priceRoute,
    userAddress,
    partner,
    partnerAddress,
    partnerFeeBps,
    receiver,
    buildOptions,
    getDecimalsForEVM(srcToken),
    getDecimalsForEVM(destToken),
    permit,
    deadline,
  );

  function checkForErrorsInResult(result: OptimalRate | APIError) {
    return (result as APIError).message === SERVER_BUSY_ERROR;
  }

  const [txBuildData, txBuildDataError] = await resolve(
    incrementalPromiseResolve(() => txData, checkForErrorsInResult),
  );

  if (txBuildDataError) {
    return {
      ...request,
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

  if (txError) {
    return {
      ...request,
      error: `Tx Error: ${txError}`,
    };
  }

  return {
    ...request,
    result: {
      swapTxHash,
      approveTxHash,
    },
  };
}

import {bnToBig, Utils, WalletType} from '@avalabs/avalanche-wallet-sdk';
import {
  Asset,
  AssetType,
  Blockchain,
  ERC20Asset,
  unwrapAsset,
  wrapAsset,
  WrapStatus,
} from '@avalabs/bridge-sdk';
import {
  FUJI_NETWORK,
  MAINNET_NETWORK,
  network$,
  wallet$,
  walletState$,
} from '@avalabs/wallet-react-components';
import Common, {Chain} from '@ethereumjs/common';
import {Transaction, TxData} from '@ethereumjs/tx';
import {
  TransactionRequest,
  TransactionResponse,
} from '@ethersproject/abstract-provider';

import Big from 'big.js';
import {BNLike, BufferLike} from 'ethereumjs-util';
import {BigNumber, BigNumberish} from 'ethers';
import {firstValueFrom} from 'rxjs';
import {
  getAvalancheProvider,
  getEthereumProvider,
} from 'screens/bridge/getEthereumBalance';
import {transferEvent$} from 'screens/bridge/transferEvent';
import {TransferEventType} from 'screens/bridge/Models';
import {bridgeConfig$} from 'screens/bridge/bridgeConfig';
import {request} from 'react-native-permissions';

export async function transferAsset(
  currentBlockchain: Blockchain,
  amount: Big,
  account: string,
  asset: Asset,
  wallet: WalletType,
): Promise<TransactionResponse> {
  const network = await firstValueFrom(network$);

  if (currentBlockchain === Blockchain.AVALANCHE) {
    const library = getAvalancheProvider(network);
    const chainId = parseInt(network?.chainId || FUJI_NETWORK.chainId);
    const common = Common.custom({
      networkId: network?.config.networkID,
      chainId,
    });
    const handleTxHashChange = (txHash: string) =>
      transferEvent$.next({type: TransferEventType.TX_HASH, txHash});

    return unwrapAsset(
      amount,
      account,
      asset as ERC20Asset,
      library,
      txData => signTransaction(wallet, common, txData),
      handleTxHashChange,
    );
  } else {
    const library = getEthereumProvider(network);
    const config = (await firstValueFrom(bridgeConfig$))?.config;
    if (!config) {
      throw new Error('missing bridge config');
    }

    const isMainnet = network?.chainId === MAINNET_NETWORK.chainId;
    const chainId = isMainnet ? Chain.Mainnet : Chain.Rinkeby;
    const common = new Common({chain: chainId});
    const ethereumWalletAddress = config.critical.walletAddresses.ethereum;
    const wrappedAsset =
      currentBlockchain === Blockchain.ETHEREUM &&
      asset.assetType === AssetType.NATIVE
        ? config.critical.assets[asset.wrappedAssetSymbol]
        : undefined;

    const handleStatusChange = (status: WrapStatus) =>
      transferEvent$.next({type: TransferEventType.WRAP_STATUS, status});
    const handleTxHashChange = (txHash: string) =>
      transferEvent$.next({type: TransferEventType.TX_HASH, txHash});

    return await wrapAsset(
      amount,
      account,
      asset,
      wrappedAsset,
      ethereumWalletAddress,
      library,
      txData => signTransaction(wallet, common, txData),
      handleStatusChange,
      handleTxHashChange,
    );
  }
}

async function signTransaction(
  wallet: WalletType,
  common: Common,
  txData: TransactionRequest,
): Promise<string> {
  const tx = Transaction.fromTxData(convertTxData(txData), {common});
  const signedTx = await wallet.signEvm(tx);
  const txHex = '0x' + signedTx.serialize().toString('hex');
  return txHex;
}

/**
 * Convert tx data from `TransactionRequest` (ethers) to `TxData` (@ethereumjs)
 */
function convertTxData(txData: TransactionRequest): TxData {
  return {
    to: txData.to,
    nonce: makeBNLike(txData.nonce),
    gasPrice: makeBNLike(txData.gasPrice),
    gasLimit: makeBNLike(txData.gasLimit),
    value: makeBNLike(txData.value),
    data: txData.data as BufferLike,
    type: txData.type,
  };
}

function makeBNLike(n: BigNumberish | undefined): BNLike | undefined {
  if (n == null) {
    return undefined;
  }
  return BigNumber.from(n).toHexString();
}

export async function transferAssetHandler(
  currentBlockchain: Blockchain,
  asset: Asset,
  amountStr: string,
) {
  const wallet = await firstValueFrom(wallet$);
  const walletState = await firstValueFrom(walletState$);
  if (!wallet || !walletState) {
    return {error: 'wallet is not ready'};
  }

  const amount = bnToBig(
    Utils.stringToBN(amountStr, asset.denomination),
    asset.denomination,
  );
  const account = walletState.addresses.addrC;

  try {
    const result = await transferAsset(
      currentBlockchain,
      amount,
      account,
      asset,
      wallet,
    );

    return Promise.resolve(result);
  } catch (error: any) {
    // user declined the transaction
    console.error(error);

    return Promise.reject('User declined the transaction');
  }
}

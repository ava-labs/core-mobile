import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  AssetType,
  BIG_ZERO,
  Blockchain,
  useBridgeFeeEstimate,
  useBridgeSDK,
  usePrice,
  WrapStatus
} from '@avalabs/bridge-sdk'
import { useState } from 'react'
import { Big } from '@avalabs/avalanche-wallet-sdk'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useBtcBridge } from 'screens/bridge/hooks/useBtcBridge'
import { useEthBridge } from 'screens/bridge/hooks/useEthBridge'
import { useAvalancheBridge } from 'screens/bridge/hooks/useAvalancheBridge'
import { AssetBalance } from 'screens/bridge/utils/types'

export interface BridgeAdapter {
  address?: string
  sourceBalance?: AssetBalance
  targetBalance?: AssetBalance
  assetsWithBalances?: AssetBalance[]
  hasEnoughForNetworkFee: boolean
  loading?: boolean
  networkFee?: Big
  /** Amount minus network and bridge fees */
  receiveAmount?: Big
  /** Maximum transfer amount */
  maximum?: Big
  /** Minimum transfer amount */
  minimum?: Big
  wrapStatus?: WrapStatus
  txHash?: string
  /**
   * Transfer funds to the target blockchain
   * @returns the transaction hash
   */
  transfer: () => Promise<string | undefined>
}

// interface Bridge extends BridgeAdapter {
//   amount: Big
//   setAmount: (amount: Big) => void
//   bridgeFee?: Big
//   /** Price for the current asset & currency code */
//   price?: Big
// }

export default function useBridge() {
  const { selectedCurrency: currency } = useApplicationContext().appHook

  const { currentBlockchain, currentAsset, currentAssetData } = useBridgeSDK()

  const [amount, setAmount] = useState<Big>(new Big(0))
  const price = usePrice(
    currentAssetData?.assetType === AssetType.BTC ? 'bitcoin' : currentAsset,
    currency.toLowerCase() as VsCurrencyType
  )

  const bridgeFee = useBridgeFeeEstimate(amount) || BIG_ZERO

  const btc = useBtcBridge(amount)
  const eth = useEthBridge(amount, bridgeFee)
  const avalanche = useAvalancheBridge(amount, bridgeFee)

  const defaults = {
    amount,
    setAmount,
    bridgeFee,
    price
  }

  if (currentBlockchain === Blockchain.BITCOIN) {
    return {
      ...defaults,
      ...btc
    }
  } else if (currentBlockchain === Blockchain.ETHEREUM) {
    return {
      ...defaults,
      ...eth
    }
  } else if (currentBlockchain === Blockchain.AVALANCHE) {
    return {
      ...defaults,
      ...avalanche
    }
  } else {
    return {
      ...defaults,
      hasEnoughForNetworkFee: true,
      transfer: () => Promise.reject('invalid bridge')
    }
  }

  // const {selectedCurrency} = useApplicationContext().appHook;
  // const network = useNetworkContext()?.network;
  //
  // const assetPrice = usePrice(currentAsset, selectedCurrency?.toLowerCase());
  // const [amountTooLowError, setAmountTooLowError] = useState<string>('');
  // const [amountTooHighError, setAmountTooHighError] = useState<string>('');
  // const [bridgeError, setBridgeError] = useState<string>();
  // const [pending, setPending] = useState<boolean>(false);
  // const assets = useAssets(currentBlockchain);
  // const assetInfo = assets[currentAsset || ''];
  // const transferCost = useTransactionFee(currentBlockchain);
  // const minimumTransferAmount = transferCost ? transferCost.mul(3) : BIG_ZERO;
  // const txFee = useTransactionFee(currentBlockchain);
  // // @ts-ignore addresses exist in walletContext
  // const {addresses} = useWalletStateContext();
  // const blockchainTokenSymbol = getTokenSymbolOnNetwork(
  //   currentAsset ?? '',
  //   currentBlockchain,
  // );
  // const sourceBalance = useAssetBalancesEVM(currentBlockchain, assetInfo);
  // const tooHighAmount =
  //   sourceBalance?.balance && amount.gt(sourceBalance.balance);
  //
  // const tooLowAmount =
  //   !!transferCost && amount.gt(0) && amount.lt(minimumTransferAmount);
  //
  // const tokenInfoContext = useTokenInfoContext();
  //
  // const {transferAsset, txHash} = useTransferAsset(assetInfo);
  //
  // const [targetBlockchain, setTargetBlockchain] = useState(
  //   Blockchain.AVALANCHE,
  // );
  //
  // const provider =
  //   currentBlockchain === Blockchain.AVALANCHE
  //     ? getAvalancheProvider(network)
  //     : getEthereumProvider(network);
  //
  // const maxTransferAmount = useMaxTransferAmount(
  //   sourceBalance.balance,
  //   addresses?.addrC,
  //   provider,
  // );
  //
  // /**
  //  * Too high amount check
  //  */
  // useEffect(() => {
  //   if (tooHighAmount) {
  //     setAmountTooHighError('Amount is greater than balance');
  //   } else {
  //     setAmountTooHighError('');
  //   }
  // }, [amount, sourceBalance]);
  //
  // /**
  //  * Amount too low check
  //  */
  // useEffect(() => {
  //   if (tooLowAmount) {
  //     setAmountTooLowError(
  //       `Amount too low. Minimum is ${minimumTransferAmount.toFixed(9)}`,
  //     );
  //   } else {
  //     setAmountTooLowError('');
  //   }
  // }, [tooLowAmount, minimumTransferAmount]);
  //
  // /**
  //  * Conditionals to enable or disable transfer button
  //  */
  // const transferDisabled =
  //   !sourceBalance.balance ||
  //   (sourceBalance.balance && amount.gt(sourceBalance.balance)) ||
  //   (bridgeError && bridgeError.length > 0) ||
  //   amountTooLowError.length > 0 ||
  //   pending ||
  //   tooLowAmount ||
  //   BIG_ZERO.eq(amount);
  //
  // return {
  //   assetPrice,
  //   currentBlockchain,
  //   currentAsset,
  //   setCurrentBlockchain,
  //   setAmount,
  //   amount,
  //   amountTooLowError,
  //   tooLowAmount,
  //   txFee,
  //   txHash,
  //   transferCost,
  //   transferAsset,
  //   blockchainTokenSymbol,
  //   targetBlockchain,
  //   setTargetBlockchain,
  //   sourceBalance,
  //   setCurrentAsset,
  //   setPending,
  //   setAmountTooLowError,
  //   bridgeError,
  //   setBridgeError,
  //   minimumTransferAmount,
  //   tokenInfoContext,
  //   maxTransferAmount,
  //   setTransactionDetails,
  //   assetInfo,
  //   pending,
  //   amountTooHighError,
  //   transferDisabled,
  // };
}

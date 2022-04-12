import {useApplicationContext} from 'contexts/ApplicationContext'
import {
  useNetworkContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import {useGetTokenSymbolOnNetwork} from 'screens/bridge/hooks/useGetTokenSymbolOnNetwork'
import {
  BIG_ZERO,
  Blockchain,
  useAssets,
  useBridgeSDK,
  useMaxTransferAmount,
  usePrice,
  useSwitchFromUnavailableAsset,
  useTokenInfoContext,
  useTransactionFee
} from '@avalabs/bridge-sdk'
import {useEffect, useState} from 'react'
import {Big} from '@avalabs/avalanche-wallet-sdk'
import {useTransferAsset} from 'screens/bridge/hooks/useTransferAsset'
import {useLoadTokenBalance} from 'screens/bridge/hooks/useLoadTokenBalance'
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider'
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider'

export default function useBridge() {
  // using this hook makes a swap between an unavailable tokens (e.g. ETH on Avalanche > Ethereum)
  // switch to an available token
  useSwitchFromUnavailableAsset()

  const {selectedCurrency} = useApplicationContext().appHook
  const network = useNetworkContext()?.network
  const {getTokenSymbolOnNetwork} = useGetTokenSymbolOnNetwork()
  const {
    currentAsset,
    setCurrentAsset,
    currentBlockchain,
    setCurrentBlockchain,
    setTransactionDetails
  } = useBridgeSDK()

  const assetPrice = usePrice(currentAsset, selectedCurrency?.toLowerCase())
  const [amount, setAmount] = useState<Big>(new Big(0))
  const [amountTooLowError, setAmountTooLowError] = useState<string>('')
  const [amountTooHighError, setAmountTooHighError] = useState<string>('')
  const [bridgeError, setBridgeError] = useState<string>()
  const [pending, setPending] = useState<boolean>(false)
  const assets = useAssets(currentBlockchain)
  const assetInfo = assets[currentAsset || '']
  const transferCost = useTransactionFee(currentBlockchain)
  const minimumTransferAmount = transferCost ? transferCost.mul(3) : BIG_ZERO
  const txFee = useTransactionFee(currentBlockchain)
  // @ts-ignore addresses exist in walletContext
  const {addresses} = useWalletStateContext()
  const blockchainTokenSymbol = getTokenSymbolOnNetwork(
    currentAsset ?? '',
    currentBlockchain
  )
  const sourceBalance = useLoadTokenBalance(currentBlockchain, assetInfo)
  const tooHighAmount =
    sourceBalance?.balance && amount.gt(sourceBalance.balance)

  const tooLowAmount =
    !!transferCost && amount.gt(0) && amount.lt(minimumTransferAmount)

  const tokenInfoContext = useTokenInfoContext()

  const {transferAsset, txHash} = useTransferAsset(assetInfo)

  const targetBlockchain =
    currentBlockchain === Blockchain.AVALANCHE
      ? Blockchain.ETHEREUM
      : Blockchain.AVALANCHE

  const provider =
    currentBlockchain === Blockchain.AVALANCHE
      ? getAvalancheProvider(network)
      : getEthereumProvider(network)

  const maxTransferAmount = useMaxTransferAmount(
    sourceBalance.balance,
    addresses?.addrC,
    provider
  )

  /**
   * Too high amount check
   */
  useEffect(() => {
    if (tooHighAmount) {
      setAmountTooHighError('Amount is greater than balance')
    } else {
      setAmountTooHighError('')
    }
  }, [amount, sourceBalance])

  /**
   * Amount too low check
   */
  useEffect(() => {
    if (tooLowAmount) {
      setAmountTooLowError(
        `Amount too low. Minimum is ${minimumTransferAmount.toFixed(9)}`
      )
    } else {
      setAmountTooLowError('')
    }
  }, [tooLowAmount, minimumTransferAmount])

  /**
   * Conditionals to enable or disable transfer button
   */
  const transferDisabled =
    !sourceBalance.balance ||
    (sourceBalance.balance && amount.gt(sourceBalance.balance)) ||
    (bridgeError && bridgeError.length > 0) ||
    amountTooLowError.length > 0 ||
    pending ||
    tooLowAmount ||
    BIG_ZERO.eq(amount)

  return {
    assetPrice,
    currentBlockchain,
    currentAsset,
    setCurrentBlockchain,
    setAmount,
    amount,
    amountTooLowError,
    tooLowAmount,
    txFee,
    txHash,
    transferCost,
    transferAsset,
    blockchainTokenSymbol,
    targetBlockchain,
    sourceBalance,
    setCurrentAsset,
    setPending,
    setAmountTooLowError,
    bridgeError,
    setBridgeError,
    minimumTransferAmount,
    tokenInfoContext,
    maxTransferAmount,
    setTransactionDetails,
    assetInfo,
    pending,
    amountTooHighError,
    transferDisabled
  }
}

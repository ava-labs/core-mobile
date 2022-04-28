import Big from 'big.js'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import {
  BIG_ZERO,
  Blockchain,
  btcToSatoshi,
  getBtcAsset,
  getBtcTransaction,
  getMinimumTransferAmount,
  satoshiToBtc,
  TxSimple,
  useBridgeConfig,
  useBridgeSDK
} from '@avalabs/bridge-sdk'
import {
  useNetworkContext,
  useWalletContext
} from '@avalabs/wallet-react-components'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useEffect, useState } from 'react'
import { AssetBalance } from 'screens/bridge/AssetBalance'
import { getBtcBalance } from 'screens/bridge/hooks/getBtcBalance'
import { isMainnetNetwork } from '@avalabs/avalanche-wallet-sdk'
import { getAvalancheProvider } from 'screens/bridge/utils/getAvalancheProvider'

export function useBtcBridge(amountInBtc: Big): BridgeAdapter {
  const network = useNetworkContext()?.network
  const bridgeConfig = useBridgeConfig()!.config!
  const { createBridgeTransaction, signIssueBtc } =
    useBridgeContext()
  const config = useBridgeConfig().config
  const wallet = useWalletContext().wallet
  const { currentAsset, setTransactionDetails, currentBlockchain } =
    useBridgeSDK()

  const avalancheProvider = getAvalancheProvider(network)
  const isMainnet = network ? isMainnetNetwork(network?.config) : false
  const btcAddress =
    wallet?.getAddressBTC(isMainnet ? 'bitcoin' : 'testnet') ?? ''
  const avalancheAddress = wallet?.getAddressC()

  const isBitcoinBridge = currentBlockchain === Blockchain.BITCOIN

  const [loading, setLoading] = useState(false)
  const [btcBalance, setBtcBalance] = useState<AssetBalance>()
  const [btcBalanceAvalanche, setBtcBalanceAvalanche] = useState<AssetBalance>()
  const [utxos, setUtxos] = useState<TxSimple[]>()
  // const [btcAddress, setBtcAddress] = useState<string>();

  /** Network fee (in BTC) */
  const [networkFee, setFee] = useState<Big>(BIG_ZERO)
  /** Amount minus network and bridge fees (in BTC) */
  const [receiveAmount, setReceiveAmount] = useState<Big>(BIG_ZERO)
  /** Minimum transfer amount (in BTC) */
  const [minimum, setMinimum] = useState<Big>(BIG_ZERO)

  const amountInSatoshis = btcToSatoshi(amountInBtc)

  const btcAsset = bridgeConfig && getBtcAsset(bridgeConfig)

  const assetsWithBalances = btcAsset
    ? [
        {
          symbol: btcAsset.symbol,
          asset: btcAsset,
          balance: btcBalance?.balance
        }
      ]
    : []

  // loads balances, utxos, btcAddress
  useEffect(() => {
    async function load() {
      if (isBitcoinBridge && btcAsset) {
        setLoading(true)
        const { bitcoinUtxos, btcBalanceAvalanche, btcBalanceBitcoin } =
          await getBtcBalance(
            bridgeConfig,
            btcAddress,
            avalancheAddress!,
            avalancheProvider!
          )

        setUtxos(bitcoinUtxos)
        setBtcBalance({
          symbol: btcAsset.symbol,
          asset: btcAsset,
          balance: satoshiToBtc(btcBalanceBitcoin)
        })
        setBtcBalanceAvalanche({
          symbol: btcAsset.symbol,
          asset: btcAsset,
          balance: satoshiToBtc(btcBalanceAvalanche ?? 0)
        })
        setLoading(false)
      }
    }

    load()
  }, [btcAddress, isBitcoinBridge, network])

  useEffect(() => {
    if (!isBitcoinBridge || !bridgeConfig || !btcAddress || !utxos) {
      return
    }

    try {
      const { fee, receiveAmount } = getBtcTransaction(
        bridgeConfig,
        btcAddress,
        utxos,
        amountInSatoshis
      )

      setFee(satoshiToBtc(fee))
      setReceiveAmount(satoshiToBtc(receiveAmount))
    } catch (e) {
      // getBtcTransaction throws an error when the amount is too low
      // so set these to 0
      setFee(BIG_ZERO)
      setReceiveAmount(BIG_ZERO)
    }

    const minimumSatoshis = getMinimumTransferAmount(
      Blockchain.BITCOIN,
      bridgeConfig,
      amountInSatoshis
    )
    setMinimum(satoshiToBtc(minimumSatoshis))
  }, [amountInSatoshis, btcAddress, bridgeConfig, isBitcoinBridge, utxos])

  const transfer = useCallback(async () => {
    if (
      !isBitcoinBridge ||
      !bridgeConfig ||
      !btcAddress ||
      !utxos ||
      !wallet ||
      !config ||
      !network
    ) {
      return Promise.reject()
    }

    const timestamp = Date.now()
    const symbol = currentAsset || ''
    const { tx } = getBtcTransaction(
      bridgeConfig,
      btcAddress,
      utxos,
      amountInSatoshis
    )
    const unsignedTxHex = tx.toHex()
    const result = await signIssueBtc(unsignedTxHex)

    setTransactionDetails({
      tokenSymbol: symbol,
      amount: amountInBtc
    })

    createBridgeTransaction({
      sourceChain: Blockchain.BITCOIN,
      sourceTxHash: result?.hash ?? '', // error?
      sourceStartedAt: timestamp,
      targetChain: Blockchain.AVALANCHE,
      amount: amountInBtc,
      symbol
    })

    return result?.hash
  }, [
    amountInBtc,
    amountInSatoshis,
    btcAddress,
    btcAsset,
    bridgeConfig,
    createBridgeTransaction,
    currentAsset,
    isBitcoinBridge,
    setTransactionDetails,
    utxos
  ])

  return {
    address: btcAddress,
    sourceBalance: btcBalance,
    targetBalance: btcBalanceAvalanche,
    assetsWithBalances,
    hasEnoughForNetworkFee: true, // minimum calc covers this
    loading,
    networkFee,
    receiveAmount,
    maximum: btcBalance?.balance,
    minimum,
    transfer
  }
}

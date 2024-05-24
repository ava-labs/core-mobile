import Big from 'big.js'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import {
  BIG_ZERO,
  BitcoinConfigAsset,
  Blockchain,
  btcToSatoshi,
  getBtcAsset,
  satoshiToBtc,
  useBridgeSDK
} from '@avalabs/bridge-sdk'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getBtcBalance } from 'screens/bridge/hooks/getBtcBalance'
import { AssetBalance } from 'screens/bridge/utils/types'
import {
  BitcoinInputUTXOWithOptionalScript,
  getMaxTransferAmount
} from '@avalabs/wallets-sdk'
import { useSelector } from 'react-redux'
import { selectTokensWithBalanceByNetwork } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import Logger from 'utils/Logger'
import { selectBridgeAppConfig } from 'store/bridge'
import { selectActiveAccount } from 'store/account'
import { getBitcoinNetwork } from 'services/network/utils/providerUtils'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useTransferAssetBTC } from './useTransferAssetBTC'

// eslint-disable-next-line sonarjs/cognitive-complexity
export function useBtcBridge({
  amount,
  bridgeFee,
  minimum
}: {
  amount: Big
  bridgeFee: Big
  minimum: Big
}): BridgeAdapter {
  const { activeNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const currency = useSelector(selectSelectedCurrency)
  const bridgeConfig = useSelector(selectBridgeAppConfig)
  const { createBridgeTransaction } = useBridgeContext()
  const { transfer: transferBTC } = useTransferAssetBTC()
  const { currentAsset, currentBlockchain, targetBlockchain } = useBridgeSDK()
  const btcAddress = activeAccount?.addressBTC
  const avalancheNetwork = useCChainNetwork()
  const avalancheTokens = useSelector(
    selectTokensWithBalanceByNetwork(avalancheNetwork)
  )
  const isBitcoinBridge = getIsBitcoinBridge(
    currentBlockchain,
    targetBlockchain
  )
  const [btcBalance, setBtcBalance] = useState<AssetBalance>()
  const [btcBalanceAvalanche, setBtcBalanceAvalanche] = useState<AssetBalance>()
  const [utxos, setUtxos] = useState<BitcoinInputUTXOWithOptionalScript[]>()
  const loading = !btcBalance || !btcBalanceAvalanche

  const { data: networkFee } = useNetworkFee(activeNetwork)

  const [feeRate, setFeeRate] = useState<number>(0)

  const amountInSatoshis = btcToSatoshi(amount)
  const btcAsset = bridgeConfig && getBtcAsset(bridgeConfig)
  const assetsWithBalances = getBtcAssetWithBalances(btcAsset, btcBalance)

  const maximum = useMemo(() => {
    if (!bridgeConfig || !activeAccount) return Big(0)
    const maxAmt = getMaxTransferAmount(
      utxos ?? [],
      bridgeConfig.criticalBitcoin.walletAddresses.btc,
      activeAccount.addressBTC,
      feeRate
    )
    return satoshiToBtc(maxAmt)
  }, [utxos, bridgeConfig, feeRate, activeAccount])

  const receiveAmount = amount.gt(minimum) ? amount.minus(bridgeFee) : BIG_ZERO

  // setting feeRate to lowest network fee to calculate max amount
  useEffect(() => {
    if (!networkFee) return

    setFeeRate(Number(networkFee.low.maxFeePerGas.toSubUnit()))
  }, [networkFee])

  useEffect(() => {
    async function loadBalances(): Promise<void> {
      if (isBitcoinBridge && btcAsset && btcAddress) {
        const token = await getBtcBalance(
          !activeNetwork.isTestnet,
          btcAddress,
          currency as VsCurrencyType
        )

        if (token) {
          setUtxos(token.utxos)
          setBtcBalance({
            symbol: btcAsset.symbol,
            asset: btcAsset,
            balance: satoshiToBtc(token.balance.toNumber()),
            logoUri: token.logoUri,
            priceInCurrency: token.priceInCurrency
          })
        }

        const btcAvalancheBalance = avalancheTokens.find(
          tk => tk.symbol === 'BTC.b'
        )

        setBtcBalanceAvalanche({
          symbol: btcAsset.symbol,
          asset: btcAsset,
          balance: satoshiToBtc(btcAvalancheBalance?.balance?.toNumber() ?? 0),
          logoUri: btcAvalancheBalance?.logoUri,
          priceInCurrency: btcAvalancheBalance?.priceInCurrency
        })
      }
    }

    loadBalances().catch(Logger.error)
  }, [
    btcAddress,
    isBitcoinBridge,
    activeNetwork,
    avalancheTokens,
    btcAsset,
    currency
  ])

  const transfer = useCallback(async () => {
    if (!btcAddress) return Promise.reject('Invalid address')

    if (!activeNetwork) return Promise.reject('Network not found')

    if (!bridgeConfig) return Promise.reject('Bridge config not found')

    if (!isBitcoinBridge) return Promise.reject('Invalid bridge')

    if (!amountInSatoshis || amountInSatoshis === 0)
      return Promise.reject('Invalid amount')

    if (!feeRate || feeRate === 0) return Promise.reject('Invalid fee rate')

    const bitcoinNetwork = getBitcoinNetwork(activeNetwork.isTestnet)

    const timestamp = Date.now()
    const symbol = currentAsset || ''

    const transactionHash = await transferBTC({
      amount: amountInSatoshis.toString(),
      feeRate
    })

    if (!transactionHash) return Promise.reject('Failed to transfer')

    AnalyticsService.captureWithEncryption('BridgeTransactionStarted', {
      chainId: bitcoinNetwork.chainId,
      sourceTxHash: transactionHash,
      fromAddress: btcAddress
    })

    createBridgeTransaction(
      {
        sourceChain: Blockchain.BITCOIN,
        sourceTxHash: transactionHash,
        sourceStartedAt: timestamp,
        targetChain: Blockchain.AVALANCHE,
        amount,
        symbol
      },
      activeNetwork
    ).catch(Logger.error)

    return transactionHash
  }, [
    btcAddress,
    activeNetwork,
    bridgeConfig,
    isBitcoinBridge,
    amountInSatoshis,
    feeRate,
    currentAsset,
    transferBTC,
    createBridgeTransaction,
    amount
  ])

  return {
    address: btcAddress,
    sourceBalance: btcBalance,
    targetBalance: btcBalanceAvalanche,
    assetsWithBalances,
    loading,
    receiveAmount,
    maximum,
    transfer
  }
}

const getIsBitcoinBridge = (
  currentBlockchain: Blockchain,
  targetBlockchain: Blockchain
): boolean => {
  return (
    currentBlockchain === Blockchain.BITCOIN ||
    targetBlockchain === Blockchain.BITCOIN
  )
}

const getBtcAssetWithBalances = (
  btcAsset?: BitcoinConfigAsset,
  btcBalance?: AssetBalance
): AssetBalance[] => {
  if (!btcAsset) {
    return []
  }
  return [
    {
      symbol: btcAsset.symbol,
      asset: btcAsset,
      balance: btcBalance?.balance
    }
  ]
}

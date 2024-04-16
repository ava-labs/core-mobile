import Big from 'big.js'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import {
  BIG_ZERO,
  BitcoinConfigAsset,
  Blockchain,
  btcToSatoshi,
  getBtcAsset,
  getBtcTransactionDetails,
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
import { NetworkFee } from 'services/networkFee/types'
import networkFeeService from 'services/networkFee/NetworkFeeService'
import walletService from 'services/wallet/WalletService'
import { resolve } from '@avalabs/utils-sdk'
import networkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { selectTokensWithBalanceByNetwork } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import Logger from 'utils/Logger'
import { selectBridgeAppConfig } from 'store/bridge'
import { selectActiveAccount } from 'store/account'
import {
  getAvalancheNetwork,
  getBitcoinNetwork
} from 'services/network/utils/providerUtils'
import { Btc } from 'types/Btc'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getErrorMessage } from 'utils/getErrorMessage'
import { useBitcoinProvider } from 'hooks/networkProviderHooks'
import { useNetworks } from 'hooks/networks/useNetworks'

export function useBtcBridge(amountInBtc: Big, fee: number): BridgeAdapter {
  const { activeNetwork, networks } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const currency = useSelector(selectSelectedCurrency)
  const bridgeConfig = useSelector(selectBridgeAppConfig)
  const { createBridgeTransaction } = useBridgeContext()
  const { currentAsset, currentBlockchain, targetBlockchain } = useBridgeSDK()
  const btcAddress = activeAccount?.addressBtc
  const avalancheNetwork = getAvalancheNetwork(
    networks,
    activeNetwork.isTestnet
  )
  const avalancheTokens = useSelector(
    selectTokensWithBalanceByNetwork(avalancheNetwork)
  )
  const isBitcoinBridge = getIsBitcoinBridge(
    currentBlockchain,
    targetBlockchain
  )
  const bitcoinProvider = useBitcoinProvider()

  const [btcBalance, setBtcBalance] = useState<AssetBalance>()
  const [btcBalanceAvalanche, setBtcBalanceAvalanche] = useState<AssetBalance>()
  const [utxos, setUtxos] = useState<BitcoinInputUTXOWithOptionalScript[]>()
  const [feeRates, setFeeRates] = useState<NetworkFee<Btc> | undefined>()
  const [networkFee, setNetworkFee] = useState<Big>(BIG_ZERO)
  const [receiveAmount, setReceiveAmount] = useState<Big>(BIG_ZERO)

  const loading = !btcBalance || !btcBalanceAvalanche || !networkFee

  const feeRate = useMemo(() => {
    return Number(feeRates?.high.maxFeePerGas?.toSatoshi() || 0)
  }, [feeRates])

  const maximum = useMemo(() => {
    if (!bridgeConfig || !activeAccount) return Big(0)
    const maxAmt = getMaxTransferAmount(
      utxos ?? [],
      bridgeConfig.criticalBitcoin.walletAddresses.btc,
      activeAccount.addressBtc,
      feeRate
    )
    return satoshiToBtc(maxAmt)
  }, [utxos, bridgeConfig, feeRate, activeAccount])

  const amountInSatoshis = btcToSatoshi(amountInBtc)
  const btcAsset = bridgeConfig && getBtcAsset(bridgeConfig)
  const assetsWithBalances = getBtcAssetWithBalances(btcAsset, btcBalance)

  useEffect(() => {
    async function loadRateFees(): Promise<void> {
      if (isBitcoinBridge) {
        const bitcoinNetwork = getBitcoinNetwork(activeNetwork.isTestnet)
        const rates = await networkFeeService.getNetworkFee(
          bitcoinNetwork,
          Btc.fromSatoshi
        )
        setFeeRates(rates)
      }
    }

    loadRateFees().catch(Logger.error)
  }, [activeNetwork.isTestnet, isBitcoinBridge])

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

  useEffect(() => {
    if (
      !isBitcoinBridge ||
      !bridgeConfig ||
      !btcAddress ||
      !utxos ||
      amountInSatoshis === 0
    ) {
      return
    }

    try {
      const transaction = getBtcTransactionDetails(
        bridgeConfig,
        btcAddress,
        utxos,
        amountInSatoshis,
        feeRate
      )

      setNetworkFee(satoshiToBtc(transaction.fee))
      setReceiveAmount(satoshiToBtc(transaction.receiveAmount))
    } catch (e) {
      // getBtcTransaction throws an error when the amount is too low
      // so set these to 0
      Logger.error('failed to get btc transaction', e)

      setNetworkFee(BIG_ZERO)
      setReceiveAmount(BIG_ZERO)
    }
  }, [
    amountInSatoshis,
    btcAddress,
    bridgeConfig,
    isBitcoinBridge,
    utxos,
    activeNetwork,
    feeRate,
    amountInBtc
  ])

  const transfer = useCallback(async () => {
    if (
      !isBitcoinBridge ||
      !bridgeConfig ||
      !btcAddress ||
      !utxos ||
      !activeAccount ||
      !bridgeConfig ||
      !activeNetwork ||
      !amountInSatoshis ||
      amountInSatoshis === 0 ||
      !fee
    ) {
      return Promise.reject()
    }
    const bitcoinNetwork = getBitcoinNetwork(activeNetwork.isTestnet)

    const timestamp = Date.now()
    const symbol = currentAsset || ''
    const { inputs, outputs } = getBtcTransactionDetails(
      bridgeConfig,
      btcAddress,
      utxos,
      amountInSatoshis,
      fee
    )

    const inputsWithScripts = await bitcoinProvider.getScriptsForUtxos(inputs)

    const [signedTx, error] = await resolve(
      walletService.sign(
        { inputs: inputsWithScripts, outputs },
        activeAccount.index,
        bitcoinNetwork
      )
    )

    if (error || !signedTx) {
      const errMsg = getErrorMessage(error)
      Logger.error('failed to transfer', errMsg)
      return Promise.reject(errMsg)
    }

    const hash = await networkService.sendTransaction({
      signedTx,
      network: bitcoinNetwork
    })

    AnalyticsService.captureWithEncryption('BridgeTransactionStarted', {
      chainId: bitcoinNetwork.chainId,
      sourceTxHash: hash,
      fromAddress: btcAddress
    })

    createBridgeTransaction(
      {
        sourceChain: Blockchain.BITCOIN,
        sourceTxHash: hash,
        sourceStartedAt: timestamp,
        targetChain: Blockchain.AVALANCHE,
        amount: amountInBtc,
        symbol
      },
      activeNetwork
    ).catch(Logger.error)

    return hash
  }, [
    isBitcoinBridge,
    bridgeConfig,
    btcAddress,
    utxos,
    activeAccount,
    activeNetwork,
    amountInSatoshis,
    fee,
    currentAsset,
    bitcoinProvider,
    createBridgeTransaction,
    amountInBtc
  ])

  return {
    address: btcAddress,
    sourceBalance: btcBalance,
    targetBalance: btcBalanceAvalanche,
    assetsWithBalances,
    loading,
    networkFee,
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

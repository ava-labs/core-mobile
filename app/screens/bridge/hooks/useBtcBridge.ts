import Big from 'big.js'
import { BridgeAdapter } from 'screens/bridge/hooks/useBridge'
import {
  BIG_ZERO,
  Blockchain,
  btcToSatoshi,
  getBtcAsset,
  getBtcTransaction,
  satoshiToBtc,
  useBridgeSDK
} from '@avalabs/bridge-sdk'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getBtcBalance } from 'screens/bridge/hooks/getBtcBalance'
import { AssetBalance } from 'screens/bridge/utils/types'
import { BitcoinInputUTXO, getMaxTransferAmount } from '@avalabs/wallets-sdk'
import { NetworkFee } from 'services/networkFee/types'
import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId
} from '@avalabs/chains-sdk'
import networkFeeService from 'services/networkFee/NetworkFeeService'
import walletService from 'services/wallet/WalletService'
import { resolve } from '@avalabs/utils-sdk'
import networkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { selectTokensWithBalanceByNetwork } from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { selectActiveNetwork, selectNetworks } from 'store/network'
import Logger from 'utils/Logger'
import { selectBridgeAppConfig } from 'store/bridge'
import { selectActiveAccount } from 'store/account'

export function useBtcBridge(amountInBtc: Big): BridgeAdapter {
  const activeNetwork = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const currency = useSelector(selectSelectedCurrency)
  const bridgeConfig = useSelector(selectBridgeAppConfig)
  const { createBridgeTransaction } = useBridgeContext()
  const {
    currentAsset,
    setTransactionDetails,
    currentBlockchain,
    targetBlockchain
  } = useBridgeSDK()
  const isDeveloperMode = activeNetwork.isTestnet
  const btcAddress = activeAccount?.addressBtc
  const allNetworks = useSelector(selectNetworks)
  const avalancheTokens = useSelector(
    selectTokensWithBalanceByNetwork(
      isDeveloperMode
        ? allNetworks[ChainId.AVALANCHE_TESTNET_ID]
        : allNetworks[ChainId.AVALANCHE_MAINNET_ID]
    )
  )

  const isBitcoinBridge =
    currentBlockchain === Blockchain.BITCOIN ||
    targetBlockchain === Blockchain.BITCOIN

  const [btcBalance, setBtcBalance] = useState<AssetBalance>()
  const [btcBalanceAvalanche, setBtcBalanceAvalanche] = useState<AssetBalance>()
  const [utxos, setUtxos] = useState<BitcoinInputUTXO[]>()
  const [feeRates, setFeeRates] = useState<NetworkFee | null>()
  const [networkFee, setNetworkFee] = useState<Big>(BIG_ZERO)
  const [receiveAmount, setReceiveAmount] = useState<Big>(BIG_ZERO)

  const loading = !btcBalance || !btcBalanceAvalanche || !networkFee

  const feeRate = useMemo(() => {
    return Number(feeRates?.high || 0)
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
  const assetsWithBalances = btcAsset
    ? [
        {
          symbol: btcAsset.symbol,
          asset: btcAsset,
          balance: btcBalance?.balance
        }
      ]
    : []

  useEffect(() => {
    async function loadRateFees() {
      if (isBitcoinBridge) {
        const rates = await networkFeeService.getNetworkFee(
          activeNetwork.isTestnet ? BITCOIN_TEST_NETWORK : BITCOIN_NETWORK
        )
        setFeeRates(rates)
      }
    }

    loadRateFees()
  }, [activeNetwork.isTestnet, isBitcoinBridge])

  useEffect(() => {
    async function loadBalances() {
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

    loadBalances()
  }, [
    btcAddress,
    isBitcoinBridge,
    activeNetwork,
    avalancheTokens,
    btcAsset,
    isDeveloperMode,
    currency
  ])

  useEffect(() => {
    if (!isBitcoinBridge || !bridgeConfig || !btcAddress || !utxos) {
      return
    }

    try {
      const transaction = getBtcTransaction(
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
    feeRate
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
      !feeRate
    ) {
      return Promise.reject()
    }
    const bitcoinNetwork = isDeveloperMode
      ? BITCOIN_TEST_NETWORK
      : BITCOIN_NETWORK

    const timestamp = Date.now()
    const symbol = currentAsset || ''
    const { inputs, outputs } = getBtcTransaction(
      bridgeConfig,
      btcAddress,
      utxos,
      amountInSatoshis,
      feeRate
    )

    const [signedTx, error] = await resolve(
      walletService.sign(
        { inputs, outputs },
        activeAccount.index,
        bitcoinNetwork
      )
    )

    if (error || !signedTx) {
      const errMsg =
        typeof error === 'object' && error !== null
          ? error.toString()
          : 'Unexpected error'
      Logger.error('failed to transfer', errMsg)
      return Promise.reject(errMsg)
    }

    const hash = await networkService.sendTransaction(signedTx, bitcoinNetwork)

    setTransactionDetails({
      tokenSymbol: symbol,
      amount: amountInBtc
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
    )

    return hash
  }, [
    isBitcoinBridge,
    bridgeConfig,
    btcAddress,
    utxos,
    activeAccount,
    activeNetwork,
    amountInSatoshis,
    feeRate,
    isDeveloperMode,
    currentAsset,
    setTransactionDetails,
    amountInBtc,
    createBridgeTransaction
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
    maximum,
    transfer
  }
}

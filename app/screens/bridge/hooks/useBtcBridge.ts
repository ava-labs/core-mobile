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
  useBridgeConfig,
  useBridgeSDK
} from '@avalabs/bridge-sdk'
import { useBridgeContext } from 'contexts/BridgeContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getBtcBalance } from 'screens/bridge/hooks/getBtcBalance'
import { AssetBalance } from 'screens/bridge/utils/types'
import { BitcoinInputUTXO, getMaxTransferAmount } from '@avalabs/wallets-sdk'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { NetworkFee } from 'services/networkFee/types'
import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import networkFeeService from 'services/networkFee/NetworkFeeService'

import { useTokens } from 'hooks/useTokens'
import walletService from 'services/wallet/WalletService'
import { resolve } from '@avalabs/utils-sdk'
import networkService from 'services/network/NetworkService'

export function useBtcBridge(amountInBtc: Big): BridgeAdapter {
  const activeNetwork = useActiveNetwork()
  const activeAccount = useActiveAccount()
  const bridgeConfig = useBridgeConfig()!.config!
  const { createBridgeTransaction } = useBridgeContext()
  const config = useBridgeConfig().config
  const {
    currentAsset,
    setTransactionDetails,
    currentBlockchain,
    targetBlockchain
  } = useBridgeSDK()
  const isDeveloperMode = activeNetwork.isTestnet
  const btcAddress = activeAccount?.addressBtc
  const tokens = useTokens()

  const isBitcoinBridge =
    currentBlockchain === Blockchain.BITCOIN ||
    targetBlockchain === Blockchain.BITCOIN

  const [btcBalance, setBtcBalance] = useState<AssetBalance>()
  const [btcBalanceAvalanche, setBtcBalanceAvalanche] = useState<AssetBalance>()
  const [utxos, setUtxos] = useState<BitcoinInputUTXO[]>()
  const [feeRates, setFeeRates] = useState<NetworkFee | null>()
  const [networkFee, setFee] = useState<Big>(BIG_ZERO)
  const [receiveAmount, setReceiveAmount] = useState<Big>(BIG_ZERO)
  const [minimum, setMinimum] = useState<Big>(BIG_ZERO)

  const loading = !btcBalance || !btcBalanceAvalanche || !networkFee

  const feeRate = useMemo(() => {
    return feeRates?.high.toNumber() || 0
  }, [feeRates])

  const maximum = useMemo(() => {
    if (!config || !activeAccount) return Big(0)
    const maxAmt = getMaxTransferAmount(
      utxos ?? [],
      config.criticalBitcoin.walletAddresses.btc,
      activeAccount.addressBtc,
      feeRate
    )
    return satoshiToBtc(maxAmt)
  }, [utxos, config, feeRate, activeAccount])

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
  }, [isBitcoinBridge])

  useEffect(() => {
    async function loadBalances() {
      if (isBitcoinBridge && btcAsset && btcAddress) {
        const token = await getBtcBalance(
          !activeNetwork.isTestnet,
          btcAddress,
          'USD'
        )

        if (token) {
          setUtxos(token.utxos)
          setBtcBalance({
            symbol: btcAsset.symbol,
            asset: btcAsset,
            balance: satoshiToBtc(token.balance)
          })
        }

        const btcAvalancheBalance = tokens.find(tk => tk.symbol === 'BTC.b')

        if (btcAvalancheBalance) {
          setBtcBalanceAvalanche({
            symbol: btcAsset.symbol,
            asset: btcAsset,
            balance: satoshiToBtc(btcBalanceAvalanche?.balance?.toNumber() ?? 0)
          })
        }
      }
    }
    loadBalances()
  }, [
    btcAddress,
    isBitcoinBridge,
    activeNetwork,
    tokens,
    btcAsset,
    isDeveloperMode
  ])

  useEffect(() => {
    if (!isBitcoinBridge || !bridgeConfig || !btcAddress || !utxos) {
      return
    }

    try {
      const { fee, receiveAmount } = getBtcTransaction(
        bridgeConfig,
        btcAddress,
        utxos,
        amountInSatoshis,
        feeRate
      )

      setFee(satoshiToBtc(fee))
      setReceiveAmount(satoshiToBtc(receiveAmount))
    } catch (e) {
      // getBtcTransaction throws an error when the amount is too low
      // so set these to 0
      const errMessage = (e as any)?.toString()
      if (!errMessage.includes('Amount must be at least')) console.error(e)
      setFee(BIG_ZERO)
      setReceiveAmount(BIG_ZERO)
    }

    const minimumSatoshis = getMinimumTransferAmount(
      Blockchain.BITCOIN,
      bridgeConfig,
      amountInSatoshis
    )
    setMinimum(satoshiToBtc(minimumSatoshis))
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
      !config ||
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
      return Promise.reject((error as any)?.toString())
    }

    const hash = await networkService.sendTransaction(signedTx, bitcoinNetwork)

    setTransactionDetails({
      tokenSymbol: symbol,
      amount: amountInBtc
    })

    createBridgeTransaction({
      sourceChain: Blockchain.BITCOIN,
      sourceTxHash: hash,
      sourceStartedAt: timestamp,
      targetChain: Blockchain.AVALANCHE,
      amount: amountInBtc,
      symbol
    })

    return hash
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
    maximum,
    minimum,
    transfer
  }
}

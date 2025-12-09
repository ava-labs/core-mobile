import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal,
  SolanaProvider
} from '@avalabs/core-wallets-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { useEffect, useState } from 'react'
import {
  getAvalancheEvmProvider,
  getAvalancheXpProvider,
  getBitcoinProvider,
  getEthereumProvider,
  getEvmProvider,
  getSVMProvider
} from 'services/network/utils/providerUtils'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useNetworks } from './useNetworks'

export function useSVMProvider(network?: Network): SolanaProvider | undefined {
  const [svmProvider, setSVMProvider] = useState<SolanaProvider>()
  useEffect(() => {
    network && getSVMProvider(network).then(setSVMProvider).catch(Logger.error)
  }, [network])

  return svmProvider
}

// this will return an EVM provider (that uses the network.rpcUrl)
export function useEVMProvider(
  network?: Network
): JsonRpcBatchInternal | undefined {
  const [evmProvider, setEVMProvider] = useState<JsonRpcBatchInternal>()
  useEffect(() => {
    network && getEvmProvider(network).then(provider => setEVMProvider(provider as unknown as JsonRpcBatchInternal)).catch(Logger.error)
  }, [network])

  return evmProvider
}

// this will always return an ethereum provider (infura)
export function useEthereumProvider(
  isTestnet?: boolean
): JsonRpcBatchInternal | undefined {
  const { networks } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const _isTestnet = isTestnet ?? isDeveloperMode

  const [ethereumProvider, setEthereumProvider] =
    useState<JsonRpcBatchInternal>()
  useEffect(() => {
    getEthereumProvider(networks, _isTestnet)
      .then(provider => setEthereumProvider(provider as unknown as JsonRpcBatchInternal | undefined))
      .catch(Logger.error)
  }, [networks, _isTestnet])

  return ethereumProvider
}

export function useBitcoinProvider(
  isTestnet?: boolean
): BitcoinProvider | undefined {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const _isTestnet = isTestnet ?? isDeveloperMode
  const [bitcoinProvider, setBitcoinProvider] = useState<BitcoinProvider>()
  useEffect(() => {
    getBitcoinProvider(_isTestnet).then(provider => setBitcoinProvider(provider as unknown as BitcoinProvider)).catch(Logger.error)
  }, [_isTestnet])

  return bitcoinProvider
}

export function useAvalancheEvmProvider(
  isTestnet?: boolean
): JsonRpcBatchInternal | undefined {
  const { networks } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const _isTestnet = isTestnet ?? isDeveloperMode
  const [avalancheProvider, setAvalancheProvider] =
    useState<JsonRpcBatchInternal>()
  useEffect(() => {
    getAvalancheEvmProvider(networks, _isTestnet)
      .then(provider => setAvalancheProvider(provider as unknown as JsonRpcBatchInternal | undefined))
      .catch(Logger.error)
  }, [networks, _isTestnet])
  return avalancheProvider
}

export function useAvalancheXpProvider(
  isTestnet?: boolean
): Avalanche.JsonRpcProvider | undefined {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const _isTestnet = isTestnet ?? isDeveloperMode
  const [avalancheXpProvider, setAvalancheXpProvider] =
    useState<Avalanche.JsonRpcProvider>()
  useEffect(() => {
    getAvalancheXpProvider(!!_isTestnet)
      .then(provider => setAvalancheXpProvider(provider as unknown as Avalanche.JsonRpcProvider))
      .catch(Logger.error)
  }, [_isTestnet])
  return avalancheXpProvider
}

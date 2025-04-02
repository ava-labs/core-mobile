import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { useEffect, useState } from 'react'
import {
  getAvalancheEvmProvider,
  getAvalancheXpProvider,
  getBitcoinProvider,
  getEthereumProvider,
  getEvmProvider
} from 'services/network/utils/providerUtils'
import Logger from 'utils/Logger'
import { useNetworks } from './useNetworks'

// this will return an EVM provider (that uses the network.rpcUrl)
export function useEVMProvider(
  network: Network
): JsonRpcBatchInternal | undefined {
  const [evmProvider, setEVMProvider] = useState<JsonRpcBatchInternal>()
  useEffect(() => {
    getEvmProvider(network).then(setEVMProvider).catch(Logger.error)
  }, [network])

  return evmProvider
}

// this will always return an ethereum provider (infura)
export function useEthereumProvider(
  isTestnet?: boolean
): JsonRpcBatchInternal | undefined {
  const { activeNetwork, networks } = useNetworks()
  const _isTestnet = isTestnet ?? activeNetwork.isTestnet

  const [ethereumProvider, setEthereumProvider] =
    useState<JsonRpcBatchInternal>()
  useEffect(() => {
    getEthereumProvider(networks, _isTestnet)
      .then(setEthereumProvider)
      .catch(Logger.error)
  }, [networks, activeNetwork, _isTestnet])

  return ethereumProvider
}

export function useBitcoinProvider(
  isTestnet?: boolean
): BitcoinProvider | undefined {
  const { activeNetwork } = useNetworks()
  const _isTestnet = isTestnet ?? activeNetwork.isTestnet
  const [bitcoinProvider, setBitcoinProvider] = useState<BitcoinProvider>()
  useEffect(() => {
    getBitcoinProvider(_isTestnet).then(setBitcoinProvider).catch(Logger.error)
  }, [activeNetwork, _isTestnet])

  return bitcoinProvider
}

export function useAvalancheProvider(
  isTestnet?: boolean
): JsonRpcBatchInternal | undefined {
  const { activeNetwork, networks } = useNetworks()
  const _isTestnet = isTestnet ?? activeNetwork.isTestnet
  const [avalancheProvider, setAvalancheProvider] =
    useState<JsonRpcBatchInternal>()
  useEffect(() => {
    getAvalancheEvmProvider(networks, _isTestnet)
      .then(setAvalancheProvider)
      .catch(Logger.error)
  }, [networks, activeNetwork, _isTestnet])
  return avalancheProvider
}

export function useAvalancheXpProvider(
  isTestnet?: boolean
): Avalanche.JsonRpcProvider | undefined {
  const { activeNetwork } = useNetworks()
  const _isTestnet = isTestnet ?? activeNetwork.isTestnet
  const [avalancheXpProvider, setAvalancheXpProvider] =
    useState<Avalanche.JsonRpcProvider>()
  useEffect(() => {
    getAvalancheXpProvider(!!_isTestnet)
      .then(setAvalancheXpProvider)
      .catch(Logger.error)
  }, [activeNetwork, _isTestnet])
  return avalancheXpProvider
}

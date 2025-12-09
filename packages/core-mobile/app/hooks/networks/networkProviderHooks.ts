import { SolanaProvider } from '@avalabs/core-wallets-sdk'
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
): Awaited<ReturnType<typeof getEvmProvider>> | undefined {
  const [evmProvider, setEVMProvider] =
    useState<Awaited<ReturnType<typeof getEvmProvider>>>()
  useEffect(() => {
    if (network) {
      getEvmProvider(network)
        .then(provider => setEVMProvider(provider))
        .catch(Logger.error)
    }
  }, [network])

  return evmProvider
}

// this will always return an ethereum provider (infura)
export function useEthereumProvider(
  isTestnet?: boolean
): Awaited<ReturnType<typeof getEthereumProvider>> | undefined {
  const { networks } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const _isTestnet = isTestnet ?? isDeveloperMode

  const [ethereumProvider, setEthereumProvider] =
    useState<Awaited<ReturnType<typeof getEthereumProvider>>>()
  useEffect(() => {
    getEthereumProvider(networks, _isTestnet)
      .then(provider => {
        if (provider) {
          setEthereumProvider(provider)
        }
      })
      .catch(Logger.error)
  }, [networks, _isTestnet])

  return ethereumProvider
}

export function useBitcoinProvider(
  isTestnet?: boolean
): Awaited<ReturnType<typeof getBitcoinProvider>> | undefined {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const _isTestnet = isTestnet ?? isDeveloperMode
  const [bitcoinProvider, setBitcoinProvider] =
    useState<Awaited<ReturnType<typeof getBitcoinProvider>>>()
  useEffect(() => {
    getBitcoinProvider(_isTestnet)
      .then(provider => setBitcoinProvider(provider))
      .catch(Logger.error)
  }, [_isTestnet])

  return bitcoinProvider
}

export function useAvalancheEvmProvider(
  isTestnet?: boolean
): Awaited<ReturnType<typeof getAvalancheEvmProvider>> | undefined {
  const { networks } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const _isTestnet = isTestnet ?? isDeveloperMode
  const [avalancheProvider, setAvalancheProvider] =
    useState<Awaited<ReturnType<typeof getAvalancheEvmProvider>>>()
  useEffect(() => {
    getAvalancheEvmProvider(networks, _isTestnet)
      .then(provider => {
        if (provider) {
          setAvalancheProvider(provider)
        }
      })
      .catch(Logger.error)
  }, [networks, _isTestnet])
  return avalancheProvider
}

export function useAvalancheXpProvider(
  isTestnet?: boolean
): Awaited<ReturnType<typeof getAvalancheXpProvider>> | undefined {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const _isTestnet = isTestnet ?? isDeveloperMode
  const [avalancheXpProvider, setAvalancheXpProvider] =
    useState<Awaited<ReturnType<typeof getAvalancheXpProvider>>>()
  useEffect(() => {
    getAvalancheXpProvider(!!_isTestnet)
      .then(provider => setAvalancheXpProvider(provider))
      .catch(Logger.error)
  }, [_isTestnet])
  return avalancheXpProvider
}

import {
  Environment,
  fetchConfig,
  setBridgeEnvironment,
  useBridgeConfig,
  useBridgeConfigUpdater
} from '@avalabs/bridge-sdk'
import { useEffect, useState } from 'react'
import {
  MAINNET_NETWORK,
  useNetworkContext
} from '@avalabs/wallet-react-components'

export function useLoadBridgeConfig() {
  const [bridgeAvailable, setBridgeAvailable] = useState(false)
  const bridgeConfig = useBridgeConfig()
  const network = useNetworkContext()?.network

  useEffect(() => {
    setBridgeEnvironment(
      network?.chainId === MAINNET_NETWORK.chainId
        ? Environment.PROD
        : Environment.DEV
    )
  }, [network])

  useBridgeConfigUpdater(() => fetchConfig())

  useEffect(() => {
    if (bridgeConfig?.config) {
      setBridgeAvailable(true)
    }
  }, [bridgeConfig, network])

  return bridgeAvailable
}

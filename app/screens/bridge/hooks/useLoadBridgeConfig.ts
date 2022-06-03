import {
  Environment,
  fetchConfig,
  setBridgeEnvironment,
  useBridgeConfig,
  useBridgeConfigUpdater
} from '@avalabs/bridge-sdk'
import { ChainId } from '@avalabs/chains-sdk'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

export function useLoadBridgeConfig() {
  const [bridgeAvailable, setBridgeAvailable] = useState(false)
  const bridgeConfig = useBridgeConfig()
  const network = useSelector(selectActiveNetwork)

  useEffect(() => {
    setBridgeEnvironment(
      network.chainId === ChainId.AVALANCHE_MAINNET_ID
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

import {
  Environment,
  fetchConfig,
  setBridgeEnvironment,
  useBridgeConfig,
  useBridgeConfigUpdater
} from '@avalabs/bridge-sdk'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

export function useLoadBridgeConfig() {
  const [bridgeAvailable, setBridgeAvailable] = useState(false)
  const bridgeConfig = useBridgeConfig()
  const network = useSelector(selectActiveNetwork)

  useEffect(() => {
    setBridgeEnvironment(
      !network.isTestnet ? Environment.PROD : Environment.TEST
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

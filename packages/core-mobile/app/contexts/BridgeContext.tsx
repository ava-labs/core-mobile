import React, { ReactNode, useEffect } from 'react'
import {
  BridgeSDKProvider,
  BridgeTransaction,
  useBridgeSDK
} from '@avalabs/core-bridge-sdk'
import { useSelector } from 'react-redux'
import { selectBridgeConfig } from 'store/bridge/slice'
import { isEqual } from 'lodash'
import BridgeService from 'services/bridge/BridgeService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export type PartialBridgeTransaction = Pick<
  BridgeTransaction,
  | 'sourceChain'
  | 'sourceTxHash'
  | 'sourceStartedAt'
  | 'targetChain'
  | 'amount'
  | 'symbol'
>

export function BridgeProvider({
  children
}: {
  children: ReactNode
}): JSX.Element {
  return (
    <BridgeSDKProvider>
      <LocalBridgeProvider>{children}</LocalBridgeProvider>
    </BridgeSDKProvider>
  )
}

function LocalBridgeProvider({
  children
}: {
  children: ReactNode
}): JSX.Element {
  const bridgeConfig = useSelector(selectBridgeConfig)
  const { bridgeConfig: bridgeConfigSDK, setBridgeConfig } = useBridgeSDK()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  useEffect(() => {
    BridgeService.setBridgeEnvironment(isDeveloperMode)
  }, [isDeveloperMode])

  useEffect(() => {
    // sync bridge config in bridge sdk with ours
    // this is necessary because:
    // 1/ we don't use useBridgeConfigUpdater() any more.
    //    instead, we have a redux listener that fetches the config periodically
    // 2/ we still depend on a lot of things in the bridge sdk (avalancheAssets, ethereumAssets,...)
    if (bridgeConfig && !isEqual(bridgeConfig, bridgeConfigSDK)) {
      setBridgeConfig(bridgeConfig)
    }
  }, [bridgeConfig, bridgeConfigSDK, setBridgeConfig])

  return <>{children}</>
}

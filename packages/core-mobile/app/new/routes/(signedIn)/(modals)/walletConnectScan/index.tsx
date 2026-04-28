import React from 'react'
import { Redirect } from 'expo-router'
import { useSelector } from 'react-redux'
import { selectIsWalletConnectBlocked } from 'store/posthog'
import { WalletConnectScanScreen } from 'features/rpc/screens/WalletConnectScanScreen'

export default function WalletConnectScanRoute(): JSX.Element {
  const isWalletConnectBlocked = useSelector(selectIsWalletConnectBlocked)
  if (isWalletConnectBlocked) {
    return <Redirect href="/portfolio" />
  }
  return <WalletConnectScanScreen />
}

import React from 'react'
import { Redirect } from 'expo-router'
import { useSelector } from 'react-redux'
import { selectIsWalletConnectBlocked } from 'store/posthog'
import AuthorizeDappScreen from 'features/rpc/screens/AuthorizeDappScreen'

export default function AuthorizeDappRoute(): JSX.Element {
  const isWalletConnectBlocked = useSelector(selectIsWalletConnectBlocked)
  if (isWalletConnectBlocked) {
    return <Redirect href="/portfolio" />
  }
  return <AuthorizeDappScreen />
}

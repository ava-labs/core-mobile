import { Stack } from 'common/components/Stack'
import {
  homeScreenOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { InteractionManager } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectWalletState, WalletState } from 'store/app'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

export default function PortfolioLayout(): JSX.Element {
  const { navigate } = useRouter()
  const activeAccount = useSelector(selectActiveAccount)
  const hasBeenViewedSolanaLaunch = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SOLANA_LAUNCH)
  )
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const walletState = useSelector(selectWalletState)

  useEffect(() => {
    // Only show modal when wallet is active and user hasn't seen it before
    if (
      !hasBeenViewedSolanaLaunch &&
      !isSolanaSupportBlocked &&
      walletState === WalletState.ACTIVE &&
      activeAccount !== undefined
    ) {
      InteractionManager.runAfterInteractions(() => {
        // @ts-ignore TODO: Add types
        navigate('/(signedIn)/(modals)/solanaLaunch')
      })
    }
  }, [
    hasBeenViewedSolanaLaunch,
    isSolanaSupportBlocked,
    navigate,
    walletState,
    activeAccount
  ])

  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
    </Stack>
  )
}

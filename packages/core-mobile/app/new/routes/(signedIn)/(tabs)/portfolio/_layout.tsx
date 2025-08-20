import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useHomeScreenOptions } from 'common/hooks/useHomeScreenOptions'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { InteractionManager } from 'react-native'
import { useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { selectHasBeenViewedOnce, ViewOnceKey } from 'store/viewOnce'

export default function PortfolioLayout(): JSX.Element {
  const homeScreenOptions = useHomeScreenOptions()
  const { navigate } = useRouter()

  const hasBeenViewedSolanaLaunch = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.SOLANA_LAUNCH)
  )
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const walletState = useSelector(selectWalletState)

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      // Only show modal when wallet is active and user hasn't seen it before
      if (
        !hasBeenViewedSolanaLaunch &&
        !isSolanaSupportBlocked &&
        walletState === WalletState.ACTIVE
      ) {
        // @ts-ignore TODO: Add types
        navigate('/(signedIn)/(modals)/solanaLaunch')
      }
    })
    return () => {
      task.cancel()
    }
  }, [hasBeenViewedSolanaLaunch, isSolanaSupportBlocked, navigate, walletState])

  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
    </Stack>
  )
}

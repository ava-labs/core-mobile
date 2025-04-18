import { Confetti, ConfettiMethods } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import {
  formSheetScreensOptions,
  modalScreensOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { ConfettiContext } from 'common/contexts/ConfettiContext'
import { CollectiblesProvider } from 'features/portfolio/collectibles/CollectiblesContext'
import React, { useRef } from 'react'

const PolyfillCrypto = React.lazy(() => import('react-native-webview-crypto'))

export default function WalletLayout(): JSX.Element {
  const confettiRef = useRef<ConfettiMethods>(null)

  return (
    <ConfettiContext.Provider value={confettiRef.current}>
      <CollectiblesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen
            name="(modals)/accountSettings"
            options={modalScreensOptions}
          />
          <Stack.Screen name="(modals)/receive" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/notifications"
            options={modalScreensOptions}
          />
          <Stack.Screen name="(modals)/send" options={modalScreensOptions} />
          <Stack.Screen name="(modals)/swap" options={modalScreensOptions} />
          <Stack.Screen name="(modals)/buy" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/selectToken"
            options={formSheetScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectReceiveNetwork"
            options={formSheetScreensOptions}
          />
          <Stack.Screen
            name="(modals)/tokenManagement"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/trackTokenDetail"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/collectibleManagement"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/addStake"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/stakeDetail"
            options={stackNavigatorScreenOptions}
          />
          <Stack.Screen
            name="(modals)/claimStakeReward"
            options={modalScreensOptions}
          />
        </Stack>
        <PolyfillCrypto />
        <Confetti ref={confettiRef} />
      </CollectiblesProvider>
    </ConfettiContext.Provider>
  )
}

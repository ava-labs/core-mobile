import { LastTransactedNetworks } from 'common/components/LastTransactedNetworks'
import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import { BridgeProvider } from 'features/bridge/contexts/BridgeContext'
import { CollectiblesProvider } from 'features/portfolio/collectibles/CollectiblesContext'
import { NavigationPresentationMode } from 'new/common/types'
import React from 'react'

const PolyfillCrypto = React.lazy(() => import('react-native-webview-crypto'))

export const unstable_settings = {
  initialRouteName: '(tabs)' // Ensure tabs are rendered first
}

export default function WalletLayout(): JSX.Element {
  const {
    modalScreensOptions,
    formSheetScreensOptions,
    stackModalScreensOptions
  } = useModalScreenOptions()

  return (
    <BridgeProvider>
      <CollectiblesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen
            name="(modals)/accountSettings"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/approval"
            options={({ route }) => {
              if (
                // @ts-ignore
                route.params?.presentationMode ===
                NavigationPresentationMode.FORM_SHEET
              ) {
                return formSheetScreensOptions
              }

              return modalScreensOptions
            }}
          />
          <Stack.Screen name="(modals)/receive" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/notifications"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/walletConnectScan"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/authorizeDapp"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/collectibleSend"
            options={modalScreensOptions}
          />
          <Stack.Screen name="(modals)/send" options={modalScreensOptions} />
          <Stack.Screen name="(modals)/swap" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/selectSwapFromToken"
            options={formSheetScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectSwapToToken"
            options={formSheetScreensOptions}
          />
          <Stack.Screen name="(modals)/buy" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/selectSendToken"
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
            name="(modals)/tokenDetail"
            options={stackModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/defiDetail"
            options={stackModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/collectibleDetail"
            options={stackModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/trackTokenDetail"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/collectibleManagement"
            options={modalScreensOptions}
          />
          <Stack.Screen name="(modals)/bridge" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/bridgeStatus"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectBridgeSourceNetwork"
            options={formSheetScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectBridgeTargetNetwork"
            options={formSheetScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectBridgeToken"
            options={formSheetScreensOptions}
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
          <Stack.Screen
            name="(modals)/toggleDeveloperMode"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/editContact"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/addEthereumChain"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectCustomTokenNetwork"
            options={formSheetScreensOptions}
          />
          <Stack.Screen
            name="(modals)/buyOnramp"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectBuyToken"
            options={formSheetScreensOptions}
          />
        </Stack>
        <PolyfillCrypto />
        <LastTransactedNetworks />
      </CollectiblesProvider>
    </BridgeProvider>
  )
}

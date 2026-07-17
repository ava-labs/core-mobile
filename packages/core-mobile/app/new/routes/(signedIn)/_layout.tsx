import { usePreventRemove } from 'expo-router/react-navigation'
import { LastTransactedNetworks } from 'common/components/LastTransactedNetworks'
import { Stack } from 'common/components/Stack'
import {
  stackNavigatorScreenOptions,
  stackScreensOptions,
  useModalScreensOptions
} from 'common/consts/screenOptions'
import {
  onClosingTransitionEnd,
  onClosingTransitionStart
} from 'common/utils/navigationGuard'
import { useTriggerAfterLoginFlows } from 'common/hooks/useTriggerAfterLoginFlows'
import { LedgerSetupProvider } from 'features/ledger'
import { useLedgerAppStateListener } from 'features/ledger/hooks/useLedgerAppStateListener'
import { CollectiblesProvider } from 'features/portfolio/collectibles/CollectiblesContext'
import { NavigationPresentationMode } from 'new/common/types'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectWalletState } from 'store/app'
import { WalletState } from 'store/app/types'
import { selectIsActiveWalletLedger } from 'store/wallet/slice'

// Note: React.lazy() is not supported in React Native with Metro bundler since 0.81.0.
// This polyfill needs to be available early anyway to ensure crypto operations work.
import PolyfillCrypto from 'react-native-webview-crypto'

export const unstable_settings = {
  initialRouteName: '(tabs)' // Ensure tabs are rendered first
}

export default function WalletLayout(): JSX.Element {
  const walletState = useSelector(selectWalletState)
  const isLedgerWallet = useSelector(selectIsActiveWalletLedger)

  // Manage Ledger BLE lifecycle: forget device when switching away,
  // auto-disconnect on background, auto-reconnect on foreground.
  useLedgerAppStateListener(isLedgerWallet)

  const { modalScreensOptions, secondaryModalScreensOptions } =
    useModalScreensOptions()

  usePreventRemove(walletState === WalletState.ACTIVE, () => {
    // TODO: uncomment this after we fix the multiple back() calls
    // back() calls are triggered too many times when closing a bunch of modals
    // which closes the app on Android
    // BackHandler.exitApp()
  })

  useTriggerAfterLoginFlows()

  return (
    <CollectiblesProvider>
      <LedgerSetupProvider>
        <Stack
          screenOptions={{ headerShown: false }}
          screenListeners={{
            transitionStart: e => {
              if (e.data.closing) onClosingTransitionStart()
            },
            transitionEnd: e => {
              if (e.data.closing) onClosingTransitionEnd()
            }
          }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen
            name="(modals)/accountSettings"
            options={{ ...modalScreensOptions }}
          />
          <Stack.Screen
            name="(modals)/approval"
            options={({ route }) => {
              if (
                // @ts-ignore
                route.params?.presentationMode ===
                NavigationPresentationMode.FORM_SHEET
              ) {
                return secondaryModalScreensOptions
              }

              return modalScreensOptions
            }}
          />
          <Stack.Screen
            name="(modals)/approvalBatch"
            options={({ route }) => {
              if (
                // @ts-ignore
                route.params?.presentationMode ===
                NavigationPresentationMode.FORM_SHEET
              ) {
                return secondaryModalScreensOptions
              }

              return modalScreensOptions
            }}
          />
          <Stack.Screen
            name="(modals)/keystoneSigner"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/keystoneTroubleshooting"
            options={secondaryModalScreensOptions}
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
            name="(modals)/authorizeInjectedDapp"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/collectibleSend"
            options={modalScreensOptions}
          />
          <Stack.Screen name="(modals)/send" options={modalScreensOptions} />
          <Stack.Screen name="(modals)/swap" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/recurringSwapSchedules"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsOnboarding"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsSearch"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsPositions"
            options={stackScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsPositionsSearch"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsPositionsHistory"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsBalance"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsPlaceOrder"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsClose"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsManage"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectSwapFromToken"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectSwapToToken"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen name="(modals)/buy" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/selectSendToken"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/stakeAdvancedFilters"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectReceiveNetwork"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/tokenManagement"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/tokenDetail"
            options={stackScreensOptions}
          />
          <Stack.Screen
            name="(modals)/defiDetail"
            options={stackScreensOptions}
          />
          <Stack.Screen
            name="(modals)/collectibleDetail"
            options={stackScreensOptions}
          />
          <Stack.Screen
            name="(modals)/trackTokenDetail"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/marketDetail"
            options={stackNavigatorScreenOptions}
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
            name="(modals)/addStakeV2"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/stakeDetail"
            options={stackNavigatorScreenOptions}
          />
          <Stack.Screen
            name="(modals)/stakeSearch"
            options={secondaryModalScreensOptions}
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
            options={stackNavigatorScreenOptions}
          />
          <Stack.Screen
            name="(modals)/addEthereumChain"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/watchAsset"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/selectCustomTokenNetwork"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meld/onramp"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meld/offramp"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meldOnrampTokenList"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meldOfframpTokenList"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meldOnrampPaymentMethod"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meldOfframpPaymentMethod"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meldOnrampCountry"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meldOnrampCurrency"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meldOfframpCountry"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/meldOfframpCurrency"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/transactionSuccessful"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/solanaLaunch"
            options={modalScreensOptions}
          />
          {/* Nest Egg disabled (CP-14058): feature unused and linked to a
              blank, un-dismissable modal on iOS. Commented out (not removed)
              so it can be re-enabled later. */}
          {/* <Stack.Screen
            name="(modals)/nestEggCampaign"
            options={modalScreensOptions}
          /> */}
          <Stack.Screen
            name="(modals)/appUpdate"
            options={modalScreensOptions}
          />
          <Stack.Screen name="(modals)/deposit" options={modalScreensOptions} />
          <Stack.Screen name="(modals)/borrow" options={modalScreensOptions} />
          <Stack.Screen
            name="(modals)/depositDetail"
            options={stackScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsDetails"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsDeposit"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/perpetualsWithdraw"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/withdraw"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/borrowRepay"
            options={modalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/wallets"
            options={{
              ...stackScreensOptions,
              animation: 'fade_from_bottom',
              animationDuration: 200
            }}
          />
          <Stack.Screen
            name="(modals)/solanaConnection"
            options={secondaryModalScreensOptions}
          />
          <Stack.Screen
            name="(modals)/addAccountAppConnection"
            options={secondaryModalScreensOptions}
          />
        </Stack>
        <PolyfillCrypto />
        <LastTransactedNetworks />
      </LedgerSetupProvider>
    </CollectiblesProvider>
  )
}

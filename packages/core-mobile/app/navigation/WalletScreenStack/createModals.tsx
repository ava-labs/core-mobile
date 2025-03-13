import React, { useEffect, useLayoutEffect, useRef } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import { useNavigation, useRoute } from '@react-navigation/native'
import EditGasLimitBottomSheet from 'screens/shared/EditGasLimitBottomSheet'
import AccountDropdown from 'screens/portfolio/account/AccountDropdown'
import SessionProposalV2 from 'screens/rpc/components/v2/SessionProposal/SessionProposal'
import SelectTokenBottomSheet from 'screens/swap/SelectTokenBottomSheet'
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet'
import CreateRemoveContactV2 from 'screens/rpc/components/v2/CreateRemoveContact'
import UpdateContactV2 from 'screens/rpc/components/v2/UpdateContact/UpdateContact'
import BridgeAssetV2 from 'screens/rpc/components/v2/BridgeAsset'
import AddEthereumChainV2 from 'screens/rpc/components/v2/AddEthereumChain'
import SwitchEthereumChainV2 from 'screens/rpc/components/v2/SwitchEthereumChain'
import ApprovalPopup from 'screens/rpc/components/v2/ApprovalPopup'
import BuyCarefully from 'screens/rpc/buy/BuyCarefully'
import { DisclaimerBottomSheet } from 'screens/earn/components/DisclaimerBottomSheet'
import IntroModal from 'screens/onboarding/IntroModal'
import { ViewOnceKey } from 'store/viewOnce'
import SearchIcon from 'assets/icons/search.svg'
import Photo from 'assets/icons/photo_placeholder.svg'
import Swap from 'assets/icons/swap_v2.svg'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { View } from '@avalabs/k2-mobile'
import { Animated, Platform } from 'react-native'
import TabsListScreen from 'screens/browser/TabsListScreen'
import { AreYouSureModal } from 'screens/browser/AreYouSureModal'
import AnalyticsConsentSheet from 'screens/mainView/AnalyticsConsentSheet'
import { AvalancheSetDeveloperMode } from 'screens/rpc/components/v2/AvalancheSetDeveloperMode'
import { UseWalletConnectModal } from 'screens/browser/UseWalletConnectModal'
import AlertScreen from 'screens/rpc/components/v2/AlertScreen'
import EditSpendLimit from 'components/EditSpendLimit'
import TransactionDataScreen from 'screens/rpc/components/v2/TransactionDataScreen'
import EnableNotificationsModal from 'screens/notifications/EnableNotificationsModal'
import QRScannerScreen from 'screens/shared/QRScannerScreen'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { SignOutModalScreen, WalletScreenSType } from './WalletScreenStack'

export const createModals = (WalletScreenS: WalletScreenSType): JSX.Element => {
  /* we have to disable gesture here so bottom sheet swipe down gesture
      doesn't conflict with react navigation swipe down */
  const walletConnectV2Modals = (
    <WalletScreenS.Group screenOptions={{ gestureEnabled: false }}>
      <WalletScreenS.Screen
        name={AppNavigation.Modal.SessionProposalV2}
        component={SessionProposalV2}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.CreateRemoveContactV2}
        component={CreateRemoveContactV2}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.UpdateContactV2}
        component={UpdateContactV2}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.AddEthereumChainV2}
        component={AddEthereumChainV2}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.SwitchEthereumChainV2}
        component={SwitchEthereumChainV2}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.BridgeAssetV2}
        component={BridgeAssetV2}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.ApprovalPopup}
        component={ApprovalPopup}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.EditSpendLimit}
        component={EditSpendLimit}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.TransactionData}
        component={TransactionDataScreen}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.AvalancheSetDeveloperMode}
        component={AvalancheSetDeveloperMode}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.AlertScreen}
        component={AlertScreen}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.EnableNotificationsPrompt}
        component={EnableNotificationsModal}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.QRScanner}
        component={QRScannerScreen}
      />
      <WalletScreenS.Group
        screenOptions={{
          cardOverlayEnabled: true
        }}>
        <WalletScreenS.Screen
          name={AppNavigation.Modal.CoreIntro}
          component={CoreIntroModal}
        />
      </WalletScreenS.Group>
    </WalletScreenS.Group>
  )

  const browserModals = (
    <WalletScreenS.Group>
      <WalletScreenS.Screen
        name={AppNavigation.Modal.BrowserTabsList}
        options={{
          presentation: 'modal',
          cardStyleInterpolator: ({ current: { progress } }) => {
            return {
              cardStyle: {
                opacity: progress
              }
            }
          }
        }}
        component={TabsListScreen}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.BrowserTabCloseAll}
        options={{
          presentation: 'transparentModal'
        }}
        component={AreYouSureModal}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.UseWalletConnect}
        options={{
          presentation: 'transparentModal'
        }}
        component={UseWalletConnectModal}
      />
    </WalletScreenS.Group>
  )

  return (
    <WalletScreenS.Group screenOptions={{ presentation: 'transparentModal' }}>
      {walletConnectV2Modals}
      {browserModals}
      <WalletScreenS.Screen
        name={AppNavigation.Modal.AccountDropDown}
        component={AccountDropdownComp}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.AccountBottomSheet}
        component={AccountBottomSheet}
      />
      <WalletScreenS.Screen
        options={{
          presentation: 'card',
          ...MainHeaderOptions()
        }}
        name={AppNavigation.Modal.SignOut}
        component={SignOutModalScreen}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.SelectToken}
        component={SelectTokenBottomSheet}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.EditGasLimit}
        component={EditGasLimit}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.StakeDisclaimer}
        component={StakeDisclaimer}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.BuyCarefully}
        component={BuyCarefully}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.AnalyticsConsentSheet}
        component={AnalyticsConsentSheet}
      />
    </WalletScreenS.Group>
  )
}

type AccountDropDownNavigationProp = WalletScreenProps<
  typeof AppNavigation.Modal.AccountDropDown
>['navigation']

const AccountDropdownComp = (): JSX.Element => {
  const navigation = useNavigation<AccountDropDownNavigationProp>()
  const backgroundColor = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(backgroundColor, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: false
    }).start()
  }, [backgroundColor])

  const backgroundColorInterpolate = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'black']
  })

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackgroundContainerStyle: {
        opacity: 0.5
      },
      headerShown: true,
      headerLeft: () => null,
      headerTitleAlign: 'center',
      // eslint-disable-next-line react/no-unstable-nested-components
      headerTitle: () => (
        <Animated.View
          style={{
            marginTop: Platform.OS === 'ios' ? 4 : -8,
            backgroundColor: backgroundColorInterpolate
          }}>
          <HeaderAccountSelector
            direction="up"
            onPressed={() => {
              navigation.goBack()
            }}
          />
        </Animated.View>
      )
    })
  }, [navigation, backgroundColorInterpolate])

  return (
    <View sx={{ marginTop: 4, flex: 1 }}>
      <AccountDropdown
        onAddEditAccounts={() => {
          navigation.goBack()
          navigation.navigate(AppNavigation.Modal.AccountBottomSheet)
        }}
      />
    </View>
  )
}
type EditGasLimitScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.EditGasLimit
>

const EditGasLimit = (): JSX.Element => {
  const { goBack } = useNavigation<EditGasLimitScreenProps['navigation']>()
  const { params } = useRoute<EditGasLimitScreenProps['route']>()

  return (
    <EditGasLimitBottomSheet
      gasLimit={params.gasLimit}
      maxFeePerGas={params.maxFeePerGas}
      maxPriorityFeePerGas={params.maxPriorityFeePerGas}
      onClose={goBack}
      onSave={params.onSave}
      network={params.network}
      lowMaxFeePerGas={params.lowMaxFeePerGas}
      isGasLimitEditable={params.isGasLimitEditable}
      feeDecimals={params.feeDecimals}
      noGasLimitError={params.noGasLimitError}
    />
  )
}

type StakeDisclaimerScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.StakeDisclaimer
>

const StakeDisclaimer = (): JSX.Element => {
  const { goBack } = useNavigation<StakeDisclaimerScreenProps['navigation']>()

  return <DisclaimerBottomSheet onClose={goBack} />
}

const CoreIntroModal = (): JSX.Element => {
  const descriptions = [
    { icon: <SearchIcon />, text: 'Explore the Avalanche ecosystem' },
    {
      icon: <Swap color={'white'} style={{ marginTop: 5 }} />,
      text: 'Interact with assets across multiple chains'
    },
    {
      icon: <Photo />,
      text: 'Collect and share NFTs'
    }
  ]

  return (
    <IntroModal
      heading="Welcome to Core!"
      viewOnceKey={ViewOnceKey.CORE_INTRO}
      buttonText="Get Started"
      descriptions={descriptions}
      styles={{ marginBottom: 74 }}
    />
  )
}

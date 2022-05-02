import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import Bridge from 'screens/bridge/Bridge'
import SharedBridgeTransactionStatus from 'screens/shared/BridgeTransactionStatus'
import { MainHeaderOptions, SubHeaderOptions } from 'navigation/NavUtils'
import BridgeSelectTokenBottomSheet from 'screens/bridge/BridgeSelectTokenBottomSheet'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { usePosthogContext } from 'contexts/PosthogContext'
import {
  BridgeScreenProps,
  BridgeTransactionStatusParams,
  WalletScreenProps
} from 'navigation/types'
import AddBitcoinInstructionsBottomSheet from 'screens/bridge/AddBitcoinInstructionsBottomSheet'
import AvaButton from 'components/AvaButton'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import {AssetBalance} from 'screens/bridge/utils/types';

export type BridgeStackParamList = {
  [AppNavigation.Bridge.Bridge]: undefined
  [AppNavigation.Bridge.BridgeTransactionStatus]: BridgeTransactionStatusParams
  [AppNavigation.Modal.BridgeSelectToken]: {
    onTokenSelected: (token: string) => void
    bridgeTokenList: AssetBalance[] | undefined
  }
  [AppNavigation.Bridge.AddInstructions]: undefined
  [AppNavigation.Bridge.HideWarning]: undefined
}

const BridgeStack = createStackNavigator<BridgeStackParamList>()

type BridgeNavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Bridge
>['navigation']

function BridgeScreenStack() {
  const { bridgeBlocked } = usePosthogContext()
  const { goBack } = useNavigation<BridgeNavigationProp>()

  return (
    <>
      <BridgeStack.Navigator>
        <BridgeStack.Screen
          options={{
            ...MainHeaderOptions('')
          }}
          name={AppNavigation.Bridge.Bridge}
          component={Bridge}
        />
        <BridgeStack.Screen
          options={{
            ...SubHeaderOptions('Transaction Status')
          }}
          name={AppNavigation.Bridge.BridgeTransactionStatus}
          component={BridgeTransactionStatus}
        />
        <BridgeStack.Group screenOptions={{ presentation: 'transparentModal' }}>
          <BridgeStack.Screen
            options={{ headerShown: false }}
            name={AppNavigation.Modal.BridgeSelectToken}
            component={BridgeSelectTokenBottomSheet}
          />
          <BridgeStack.Screen
            options={{ headerShown: false }}
            name={AppNavigation.Bridge.AddInstructions}
            component={AddBitcoinInstructionsBottomSheet}
          />

          <BridgeStack.Screen
            options={{ presentation: 'transparentModal', headerShown: false }}
            name={AppNavigation.Bridge.HideWarning}
            component={HideTransactionWarningModal}
          />
        </BridgeStack.Group>
      </BridgeStack.Navigator>
      {bridgeBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Bridge is currently under maintenance.  Service will resume shortly.'
          }
        />
      )}
    </>
  )
}

type HideTransactionNavigationProp = BridgeScreenProps<
  typeof AppNavigation.Bridge.HideWarning
>['navigation']

const HideTransactionWarningModal = () => {
  const navigation = useNavigation<HideTransactionNavigationProp>()

  const onHide = () => {
    navigation.getParent()?.goBack()
  }

  const onBack = () => {
    navigation.goBack()
  }

  return (
    <WarningModal
      title={'Hide Processing Transaction'}
      message={
        'Your transaction is still processing. Go to Activity to see the current status.'
      }
      actionText={'Hide'}
      dismissText={'Back'}
      onAction={onHide}
      onDismiss={onBack}
    />
  )
}

type BridgeTransactionStatusScreenProps = BridgeScreenProps<
  typeof AppNavigation.Bridge.BridgeTransactionStatus
>

const BridgeTransactionStatus = () => {
  const { navigate, setOptions } =
    useNavigation<BridgeTransactionStatusScreenProps['navigation']>()

  const { blockchain, txHash, txTimestamp } =
    useRoute<BridgeTransactionStatusScreenProps['route']>().params

  const HeaderRight = (
    <AvaButton.TextLarge
      onPress={() => {
        navigate(AppNavigation.Bridge.HideWarning)
      }}>
      Hide
    </AvaButton.TextLarge>
  )

  return (
    <SharedBridgeTransactionStatus
      setNavOptions={setOptions}
      HeaderRight={HeaderRight}
      blockchain={blockchain}
      txHash={txHash}
      txTimestamp={txTimestamp}
    />
  )
}

export default React.memo(BridgeScreenStack)

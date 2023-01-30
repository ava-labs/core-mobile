import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import { useNavigation, useRoute } from '@react-navigation/native'
import EditGasLimitBottomSheet from 'screens/shared/EditGasLimitBottomSheet'
import AccountDropdown from 'screens/portfolio/account/AccountDropdown'
import SessionProposal from 'screens/rpc/components/SessionProposal'
import SelectTokenBottomSheet from 'screens/swap/SelectTokenBottomSheet'
import AccountBottomSheet from 'screens/portfolio/account/AccountBottomSheet'
import CreateRemoveContact from 'screens/rpc/components/CreateRemoveContact'
import UpdateContact from 'screens/rpc/components/UpdateContact'
import SelectAccount from 'screens/rpc/components/SelectAccount'
import SignTransaction from 'screens/rpc/components/SignTransaction/SignTransaction'
import BridgeAsset from 'screens/rpc/components/BridgeAsset'
import SignMessage from 'screens/rpc/components/SignMessage/SignMessage'
import AddEthereumChain from 'screens/rpc/components/AddEthereumChain'
import SwitchEthereumChain from 'screens/rpc/components/SwitchEthereumChain'
import { SignOutModalScreen, WalletScreenSType } from './WalletScreenStack'
export const createModals = (WalletScreenS: WalletScreenSType) => {
  return (
    <WalletScreenS.Group screenOptions={{ presentation: 'transparentModal' }}>
      {/* we have to disable gesture here so bottom sheet swipe down gesture
      doesn't conflict with react navigation swipe down */}
      <WalletScreenS.Group screenOptions={{ gestureEnabled: false }}>
        <WalletScreenS.Screen
          name={AppNavigation.Modal.SessionProposal}
          component={SessionProposal}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.CreateRemoveContact}
          component={CreateRemoveContact}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.UpdateContact}
          component={UpdateContact}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.SelectAccount}
          component={SelectAccount}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.SignTransaction}
          component={SignTransaction}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.SignMessage}
          component={SignMessage}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.BridgeAsset}
          component={BridgeAsset}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.AddEthereumChain}
          component={AddEthereumChain}
        />
        <WalletScreenS.Screen
          name={AppNavigation.Modal.SwitchEthereumChain}
          component={SwitchEthereumChain}
        />
      </WalletScreenS.Group>
      <WalletScreenS.Screen
        options={{
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 0 } },
            close: { animation: 'timing', config: { duration: 300 } }
          }
        }}
        name={AppNavigation.Modal.AccountDropDown}
        component={AccountDropdownComp}
      />
      <WalletScreenS.Screen
        name={AppNavigation.Modal.AccountBottomSheet}
        component={AccountBottomSheet}
      />
      <WalletScreenS.Screen
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
    </WalletScreenS.Group>
  )
}

type AccountDropDownNavigationProp = WalletScreenProps<
  typeof AppNavigation.Modal.AccountDropDown
>['navigation']

const AccountDropdownComp = () => {
  const navigation = useNavigation<AccountDropDownNavigationProp>()
  return (
    <AccountDropdown
      onAddEditAccounts={() => {
        navigation.goBack()
        navigation.navigate(AppNavigation.Modal.AccountBottomSheet)
      }}
    />
  )
}
type EditGasLimitScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.EditGasLimit
>

const EditGasLimit = () => {
  const { goBack } = useNavigation<EditGasLimitScreenProps['navigation']>()
  const { params } = useRoute<EditGasLimitScreenProps['route']>()

  const onSave = (newGasLimit: number) => params.onSave(newGasLimit)

  return (
    <EditGasLimitBottomSheet
      onClose={goBack}
      onSave={onSave}
      gasLimit={params.gasLimit}
      gasPrice={params.gasPrice}
    />
  )
}

import React, { FC, useCallback } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { SeedlessExportScreenProps } from 'navigation/types'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { MainHeaderOptions } from 'navigation/NavUtils'
import OwlLoader from 'components/OwlLoader'
import { SeedlessExportInitial } from 'seedless/screens/SeedlessExportInitial'

import {
  VerifyCodeExport,
  VerifyCodeExportParams
} from 'seedless/screens/VerifyCodeExport'

export type SeedlessExportStackParamList = {
  [AppNavigation.SeedlessExport.InitialScreen]: undefined
  [AppNavigation.SeedlessExport.WaitingPeriodModal]: { onNext: () => void }
  [AppNavigation.SeedlessExport.VerifyCode]: VerifyCodeExportParams
  [AppNavigation.SeedlessExport.ConfirmCloseModal]: { onCancel: () => void }
  [AppNavigation.SeedlessExport.ConfirmCancelModal]: { onCancel: () => void }
  [AppNavigation.SeedlessExport.OwlLoader]: undefined
}

const SeedlessExportS = createStackNavigator<SeedlessExportStackParamList>()

// @ts-expect-error
const PolyfillCrypto = React.lazy(() => import('react-native-webview-crypto'))

const SeedlessExportStack: FC = () => {
  return (
    <>
      <SeedlessExportS.Navigator screenOptions={MainHeaderOptions()}>
        <SeedlessExportS.Screen
          name={AppNavigation.SeedlessExport.InitialScreen}
          component={SeedlessExportInitialScreen}
        />
        <SeedlessExportS.Screen
          options={{ presentation: 'transparentModal', headerShown: false }}
          name={AppNavigation.SeedlessExport.VerifyCode}
          component={VerifyCodeScreen}
        />
        <SeedlessExportS.Screen
          options={{ headerShown: false }}
          name={AppNavigation.SeedlessExport.OwlLoader}
          component={OwlLoader}
        />
        <SeedlessExportS.Group
          screenOptions={{ presentation: 'modal', headerShown: false }}>
          <SeedlessExportS.Screen
            name={AppNavigation.SeedlessExport.WaitingPeriodModal}
            component={WaitingPeriodModal}
          />
          <SeedlessExportS.Screen
            name={AppNavigation.SeedlessExport.ConfirmCancelModal}
            component={ConfirmCancelModal}
          />
          <SeedlessExportS.Screen
            name={AppNavigation.SeedlessExport.ConfirmCloseModal}
            component={ConfirmCloseModal}
          />
        </SeedlessExportS.Group>
      </SeedlessExportS.Navigator>
      <PolyfillCrypto />
    </>
  )
}

const SeedlessExportInitialScreen = (): JSX.Element => {
  return <SeedlessExportInitial />
}

type VerifyCodeScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.VerifyCode
>

function VerifyCodeScreen(): JSX.Element {
  const {
    params: { onVerifySuccess, userExportResponse }
  } = useRoute<VerifyCodeScreenProps['route']>()
  function handleOnVerifySuccess(): void {
    onVerifySuccess()
  }

  console.log('hello exportInitResponse')
  return (
    <VerifyCodeExport
      onVerifySuccess={handleOnVerifySuccess}
      userExportResponse={userExportResponse}
    />
  )
}

// Modals
type WaitingPeriodScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.WaitingPeriodModal
>

const WaitingPeriodModal = (): JSX.Element => {
  const { goBack, canGoBack } =
    useNavigation<WaitingPeriodScreenProps['navigation']>()
  const { onNext } = useRoute<WaitingPeriodScreenProps['route']>().params

  const onGoBack = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  return (
    <WarningModal
      title="Waiting Period"
      message="It will take 2 days to retrieve your recovery phrase. You will only have 48 hours to copy your recovery phrase once the 2 day waiting period is over."
      actionText={'Next'}
      dismissText={'Cancel'}
      onAction={onNext}
      onDismiss={onGoBack}
    />
  )
}

type ConfirmCancelModalProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.ConfirmCancelModal
>

const ConfirmCancelModal = (): JSX.Element => {
  const { goBack, canGoBack, getParent } =
    useNavigation<ConfirmCancelModalProps['navigation']>()
  const { onCancel } = useRoute<ConfirmCancelModalProps['route']>().params

  const onGoBack = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onNext = useCallback(() => {
    onCancel()
    if (getParent()?.canGoBack()) {
      getParent()?.goBack()
    }
  }, [getParent, onCancel])

  return (
    <WarningModal
      title="Confirm Cancel?"
      message="Canceling will require you to restart the 2 day waiting period."
      actionText={'Next'}
      dismissText={'Cancel'}
      onAction={onNext}
      onDismiss={onGoBack}
    />
  )
}

type ConfirmCloseModalProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.ConfirmCloseModal
>['navigation']

const ConfirmCloseModal = (): JSX.Element => {
  const { goBack, canGoBack, getParent } =
    useNavigation<ConfirmCloseModalProps>()

  const onGoBack = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onNext = useCallback(() => {
    if (getParent()?.canGoBack()) {
      getParent()?.goBack()
    }
  }, [getParent])

  return (
    <WarningModal
      title="Confirm Close?"
      message="Closing the settings menu will require you to restart the 2 day waiting period. 2 day waiting period."
      actionText={'Next'}
      dismissText={'Cancel'}
      onAction={onNext}
      onDismiss={onGoBack}
    />
  )
}

export default SeedlessExportStack

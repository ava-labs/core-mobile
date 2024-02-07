import React, { FC, useCallback } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { SeedlessExportScreenProps } from 'navigation/types'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import OwlLoader from 'components/OwlLoader'
import { SeedlessExportInitial } from 'seedless/screens/SeedlessExportInitial'
import { MainHeaderOptions } from 'navigation/NavUtils'
import {
  getConfirmCloseDelayText,
  getWaitingPeriodDescription
} from 'seedless/hooks/useSeedlessMnemonicExport'
import { goBack } from 'utils/Navigation'
import { VerifyCode } from 'seedless/screens/VerifyCode'
import { UserExportResponse } from 'seedless/types'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'

export type SeedlessExportStackParamList = {
  [AppNavigation.SeedlessExport.InitialScreen]: undefined
  [AppNavigation.SeedlessExport.WaitingPeriodModal]: { onNext: () => void }
  [AppNavigation.SeedlessExport.VerifyCode]: {
    onVerifyCode: (
      code: string
    ) => Promise<Result<UserExportResponse, TotpErrors>>
    onVerifySuccess: (cubeSignerResponse?: UserExportResponse) => void
  }
  [AppNavigation.SeedlessExport.ConfirmCloseModal]: { onCancel: () => void }
  [AppNavigation.SeedlessExport.ConfirmCancelModal]: { onCancel: () => void }
  [AppNavigation.SeedlessExport.OwlLoader]: undefined
}

const SeedlessExportS = createStackNavigator<SeedlessExportStackParamList>()

const SeedlessExportStack: FC = () => {
  return (
    <>
      <SeedlessExportS.Navigator screenOptions={MainHeaderOptions()}>
        <SeedlessExportS.Screen
          name={AppNavigation.SeedlessExport.InitialScreen}
          component={SeedlessExportInitial}
        />
        <SeedlessExportS.Screen
          name={AppNavigation.SeedlessExport.OwlLoader}
          component={OwlLoader}
        />
        <SeedlessExportS.Group
          screenOptions={{
            presentation: 'transparentModal'
          }}>
          <SeedlessExportS.Screen
            options={{ headerShown: false }}
            name={AppNavigation.SeedlessExport.VerifyCode}
            component={VerifyCodeScreen}
          />
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
    </>
  )
}

type VerifyCodeScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.VerifyCode
>

function VerifyCodeScreen(): JSX.Element {
  const {
    params: { onVerifySuccess, onVerifyCode }
  } = useRoute<VerifyCodeScreenProps['route']>()

  const handleOnVerifyCode = async (
    code: string
  ): Promise<Result<UserExportResponse, TotpErrors>> => {
    const result = await onVerifyCode(code)
    goBack()
    return result
  }

  return (
    <VerifyCode
      onVerifyCode={handleOnVerifyCode}
      onVerifySuccess={onVerifySuccess}
      onBack={goBack}
    />
  )
}

// Modals
type WaitingPeriodScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.WaitingPeriodModal
>

const WaitingPeriodModal = (): JSX.Element => {
  const { onNext } = useRoute<WaitingPeriodScreenProps['route']>().params

  const onAction = useCallback(() => {
    onNext()
    goBack()
  }, [onNext])

  return (
    <WarningModal
      title="Waiting Period"
      message={getWaitingPeriodDescription()}
      actionText={'Next'}
      dismissText={'Cancel'}
      onAction={onAction}
      onDismiss={goBack}
    />
  )
}

type ConfirmCancelModalProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.ConfirmCancelModal
>

const ConfirmCancelModal = (): JSX.Element => {
  const { getParent } = useNavigation<ConfirmCancelModalProps['navigation']>()
  const { onCancel } = useRoute<ConfirmCancelModalProps['route']>().params

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
      onDismiss={goBack}
    />
  )
}

type ConfirmCloseModalProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.ConfirmCloseModal
>

const ConfirmCloseModal = (): JSX.Element => {
  const { getParent } = useNavigation<ConfirmCloseModalProps['navigation']>()
  const { onCancel } = useRoute<ConfirmCloseModalProps['route']>().params

  const onNext = useCallback(() => {
    onCancel()
    if (getParent()?.canGoBack()) {
      getParent()?.goBack()
    }
  }, [getParent, onCancel])

  return (
    <WarningModal
      title="Confirm Close?"
      message={getConfirmCloseDelayText()}
      actionText={'Next'}
      dismissText={'Cancel'}
      onAction={onNext}
      onDismiss={goBack}
    />
  )
}

export default SeedlessExportStack

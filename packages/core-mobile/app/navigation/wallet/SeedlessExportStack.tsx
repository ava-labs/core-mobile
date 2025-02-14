import React, { FC, useCallback } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { SeedlessExportScreenProps } from 'navigation/types'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { SeedlessExportInitial } from 'seedless/screens/SeedlessExportInitial'
import { MainHeaderOptions } from 'navigation/NavUtils'
import {
  getConfirmCloseDelayText,
  getWaitingPeriodDescription
} from 'seedless/hooks/useSeedlessMnemonicExport'
import { goBack } from 'utils/Navigation'
import LogoLoader from 'components/LogoLoader'

export type SeedlessExportStackParamList = {
  [AppNavigation.SeedlessExport.InitialScreen]: undefined
  [AppNavigation.SeedlessExport.WaitingPeriodModal]: { onNext: () => void }
  [AppNavigation.SeedlessExport.ConfirmCloseModal]: { onCancel: () => void }
  [AppNavigation.SeedlessExport.ConfirmCancelModal]: { onCancel: () => void }
  [AppNavigation.SeedlessExport.LogoLoader]: undefined
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
          name={AppNavigation.SeedlessExport.LogoLoader}
          component={LogoLoader}
        />
        <SeedlessExportS.Group
          screenOptions={{
            presentation: 'transparentModal'
          }}>
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

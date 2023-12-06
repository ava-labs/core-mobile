import React, { FC, useCallback, useEffect } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { SeedlessExportScreenProps } from 'navigation/types'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SeedlessExportInstructions } from 'seedless/screens/SeedlessExportInstructions'
import WarningModal from 'components/WarningModal'
import { MainHeaderOptions } from 'navigation/NavUtils'
import Logger from 'utils/Logger'
import { VerifyCode, VerifyCodeParams } from 'seedless/screens/VerifyCode'
import {
  CubeSignerResponse,
  SignerSessionData
} from '@cubist-labs/cubesigner-sdk'
import { OidcPayload } from 'seedless/types'
import { RecoveryPhrasePending } from 'seedless/screens/RecoveryPhrasePending'
import OwlLoader from 'components/OwlLoader'
import { Button, Text } from '@avalabs/k2-mobile'
import { copyToClipboard } from 'utils/DeviceTools'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'
import { BackButton } from 'components/BackButton'
import { refreshSeedlessTokenFlow } from 'seedless/utils/refreshSeedlessTokenFlow'
import RevealMnemonic from './RevealMnemonic'

export type SeedlessExportStackParamList = {
  [AppNavigation.SeedlessExport.Instructions]: undefined
  [AppNavigation.SeedlessExport.WaitingPeriodModal]: undefined
  [AppNavigation.SeedlessExport.VerifyCode]: VerifyCodeParams
  [AppNavigation.SeedlessExport.RecoveryPhrasePending]: undefined
  [AppNavigation.SeedlessExport.RecoveryPhrase]: { mnemonic: string }
  [AppNavigation.SeedlessExport.ConfirmCloseModal]: undefined
  [AppNavigation.SeedlessExport.ConfirmCancelModal]: undefined
  [AppNavigation.SeedlessExport.OwlLoader]: undefined
}

const SeedlessExportS = createStackNavigator<SeedlessExportStackParamList>()

const SeedlessExportStack: FC = () => {
  return (
    <SeedlessExportS.Navigator screenOptions={MainHeaderOptions()}>
      <SeedlessExportS.Screen
        name={AppNavigation.SeedlessExport.Instructions}
        component={SeedlessExportInstructionsScreen}
      />
      <SeedlessExportS.Screen
        options={{ presentation: 'transparentModal', headerShown: false }}
        name={AppNavigation.SeedlessExport.VerifyCode}
        component={VerifyCodeScreen}
      />
      <SeedlessExportS.Screen
        name={AppNavigation.SeedlessExport.RecoveryPhrasePending}
        component={RecoveryPhrasePendingScreen}
      />
      <SeedlessExportS.Screen
        name={AppNavigation.SeedlessExport.RecoveryPhrase}
        component={RecoveryPhraseScreen}
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
  )
}

type InstructionsScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.Instructions
>

const SeedlessExportInstructionsScreen = (): JSX.Element => {
  const { navigate } = useNavigation<InstructionsScreenProps['navigation']>()

  const handOnNext = (): void => {
    navigate(AppNavigation.SeedlessExport.WaitingPeriodModal)
  }
  return <SeedlessExportInstructions onNext={handOnNext} />
}

type VerifyCodeScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.VerifyCode
>

function VerifyCodeScreen(): JSX.Element {
  const {
    params: { onVerifySuccess, onBack, oidcToken, mfaId }
  } = useRoute<VerifyCodeScreenProps['route']>()

  function handleOnVerifySuccess(): void {
    onVerifySuccess()
  }

  function handleOnBack(): void {
    onBack()
  }

  return (
    <VerifyCode
      onVerifySuccess={handleOnVerifySuccess}
      onBack={handleOnBack}
      oidcToken={oidcToken}
      mfaId={mfaId}
    />
  )
}

type RecoveryPhrasePendingScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.RecoveryPhrasePending
>

const RecoveryPhrasePendingScreen = (): JSX.Element => {
  const { navigate, setOptions } =
    useNavigation<RecoveryPhrasePendingScreenProps['navigation']>()

  const handleOnCancel = (): void => {
    navigate(AppNavigation.SeedlessExport.ConfirmCancelModal)
  }

  useEffect(() => {
    setOptions({
      headerLeft: ConfirmCancelBackButton
    })
  }, [setOptions])

  return <RecoveryPhrasePending onCancel={handleOnCancel} />
}

type RecoveryPhraseScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.RecoveryPhrase
>

const RecoveryPhraseScreen = (): JSX.Element => {
  const { navigate, setOptions } =
    useNavigation<RecoveryPhraseScreenProps['navigation']>()
  const { mnemonic } = useRoute<RecoveryPhraseScreenProps['route']>().params

  useEffect(() => {
    setOptions({
      headerLeft: ConfirmCloseBackButton
    })
  }, [setOptions])

  const buttonOverride = (): JSX.Element => {
    return (
      <Button
        type="secondary"
        size="xlarge"
        disabled={!mnemonic}
        onPress={() => {
          navigate(AppNavigation.Root.CopyPhraseWarning, {
            copy: () => {
              copyToClipboard(
                mnemonic,
                <SnackBarMessage message="Phrase Copied!" />
              )
            }
          })
        }}>
        Copy Phrase
      </Button>
    )
  }

  return (
    <>
      <Text variant="heading3" sx={{ marginHorizontal: 16, marginBottom: 16 }}>
        Recovery Phrase
      </Text>
      <RevealMnemonic
        mnemonic={mnemonic}
        buttonOverride={buttonOverride()}
        canToggleBlur={true}
      />
    </>
  )
}

// Modals
type WaitingPeriodScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.WaitingPeriodModal
>['navigation']

const WaitingPeriodModal = (): JSX.Element => {
  const { goBack, canGoBack, navigate, replace } =
    useNavigation<WaitingPeriodScreenProps>()

  const onGoBack = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onNext = (): void => {
    replace(AppNavigation.SeedlessExport.OwlLoader)
    const onVerifySuccessPromise = (
      loginResult: CubeSignerResponse<SignerSessionData>,
      oidcTokenResult: OidcPayload
    ): Promise<void> =>
      new Promise(() => {
        replace(AppNavigation.SeedlessExport.VerifyCode, {
          oidcToken: oidcTokenResult.oidcToken,
          mfaId: loginResult.mfaId(),
          onVerifySuccess: () => {
            navigate(AppNavigation.SeedlessExport.RecoveryPhrasePending)
          },
          onBack: onGoBack
        })
      })
    refreshSeedlessTokenFlow(onVerifySuccessPromise, onGoBack).catch(() =>
      Logger.error('WaitingPeriodModal:refreshSeedlessTokenFlow')
    )
  }

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
>['navigation']

const ConfirmCancelModal = (): JSX.Element => {
  const { goBack, canGoBack, getParent } =
    useNavigation<ConfirmCancelModalProps>()

  const onGoBack = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  const onNext = useCallback(() => {
    // todo: cancel seedless export
    if (getParent()?.canGoBack()) {
      getParent()?.goBack()
    }
  }, [getParent])

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
    // todo: cancel seedless export
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

const ConfirmCloseBackButton = (): JSX.Element => {
  const { navigate } = useNavigation<RecoveryPhraseScreenProps['navigation']>()
  return (
    <BackButton
      onPress={() => {
        navigate(AppNavigation.SeedlessExport.ConfirmCloseModal)
      }}
    />
  )
}

const ConfirmCancelBackButton = (): JSX.Element => {
  const { navigate } =
    useNavigation<RecoveryPhrasePendingScreenProps['navigation']>()
  return (
    <BackButton
      onPress={() => {
        navigate(AppNavigation.SeedlessExport.ConfirmCancelModal)
      }}
    />
  )
}

export default SeedlessExportStack

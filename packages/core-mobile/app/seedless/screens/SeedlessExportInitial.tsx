import Loader from 'components/Loader'
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  CompleteExportOnVerifyMfa,
  InitExportOnVerifyMfa,
  ExportState,
  useSeedlessMnemonicExport
} from 'seedless/hooks/useSeedlessMnemonicExport'
import { SeedlessExportScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import RevealMnemonic from 'navigation/wallet/RevealMnemonic'
import { Button } from '@avalabs/k2-mobile'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'
import { copyToClipboard } from 'utils/DeviceTools'
import Logger from 'utils/Logger'
import { BackButton } from 'components/BackButton'
import { SeedlessExportInstructions } from './SeedlessExportInstructions'
import { RecoveryPhrasePending } from './RecoveryPhrasePending'

type SeedlessExportInitialScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.InitialScreen
>

export const SeedlessExportInitial = (): JSX.Element => {
  const [hideMnemonic, setHideMnemonic] = useState(true)
  const { navigate, setOptions, goBack, canGoBack } =
    useNavigation<SeedlessExportInitialScreenProps['navigation']>()

  const {
    state,
    progress,
    timeLeft,
    mnemonic,
    initExport,
    deleteExport,
    completeExport
  } = useSeedlessMnemonicExport()

  const onCancelExportRequest = (): void => {
    navigate(AppNavigation.SeedlessExport.ConfirmCancelModal, {
      onCancel: deleteExport
    })
  }

  const onCloseExportRequest = useCallback((): void => {
    navigate(AppNavigation.SeedlessExport.ConfirmCloseModal, {
      onCancel: deleteExport
    })
  }, [deleteExport, navigate])

  const customGoBack = useCallback((): void => {
    switch (state) {
      case ExportState.ReadyToExport:
        onCloseExportRequest()
        break
      case ExportState.NotInitiated:
      case ExportState.Pending:
      default:
        if (canGoBack()) {
          goBack()
        }
        break
    }
  }, [canGoBack, goBack, onCloseExportRequest, state])

  useLayoutEffect(() => {
    setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerLeft: () => <BackButton onPress={customGoBack} />
    })
  }, [customGoBack, goBack, setOptions])

  useEffect(() => {
    if (state === ExportState.Loading) {
      setOptions({ headerShown: false })
    } else {
      setOptions({ headerShown: true })
    }
  }, [setOptions, state])

  useEffect(() => {
    mnemonic && setHideMnemonic(false)
  }, [mnemonic])

  const buttonOverride = (): JSX.Element => {
    return (
      <Button
        type="secondary"
        size="xlarge"
        leftIcon="copy"
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

  const toggleRecoveryPhrase = useCallback(async (): Promise<void> => {
    if (mnemonic === undefined) {
      const onVerifyMfa: CompleteExportOnVerifyMfa = async (
        response,
        onVerifySuccess
      ): Promise<void> => {
        navigate(AppNavigation.SeedlessExport.VerifyCode, {
          userExportResponse: response,
          // @ts-expect-error navigation can't handle generic params well
          onVerifySuccess
        })
      }

      await completeExport({ onVerifyMfa }).catch(Logger.error)
    }

    setHideMnemonic(prev => !prev)
  }, [completeExport, mnemonic, navigate])

  return (
    <>
      {state === ExportState.Loading && <Loader />}
      {state === ExportState.NotInitiated && (
        <SeedlessExportInstructions
          onNext={() =>
            navigate(AppNavigation.SeedlessExport.WaitingPeriodModal, {
              onNext: () => {
                const onVerifyMfa: InitExportOnVerifyMfa = async (
                  response,
                  onVerifySuccess
                  // eslint-disable-next-line sonarjs/no-identical-functions
                ) => {
                  navigate(AppNavigation.SeedlessExport.VerifyCode, {
                    userExportResponse: response,
                    // @ts-expect-error navigation can't handle generic params well
                    onVerifySuccess
                  })
                }

                initExport({ onVerifyMfa }).catch(Logger.error)
              }
            })
          }
        />
      )}
      {state === ExportState.Pending && (
        <RecoveryPhrasePending
          timeLeft={timeLeft}
          onCancel={onCancelExportRequest}
          progress={progress}
        />
      )}
      {state === ExportState.ReadyToExport && (
        <RevealMnemonic
          toggleRecoveryPhrase={toggleRecoveryPhrase}
          mnemonic={mnemonic}
          hideMnemonic={hideMnemonic || mnemonic === undefined}
          canToggleBlur={true}
          buttonOverride={buttonOverride()}
        />
      )}
    </>
  )
}

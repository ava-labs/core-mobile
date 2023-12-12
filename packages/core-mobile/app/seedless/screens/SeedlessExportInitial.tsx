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
import {
  CubeSignerResponse,
  UserExportCompleteResponse,
  UserExportInitResponse
} from '@cubist-labs/cubesigner-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { showSimpleToast } from 'components/Snackbar'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { SeedlessExportInstructions } from './SeedlessExportInstructions'
import { RecoveryPhrasePending } from './RecoveryPhrasePending'

type SeedlessExportInitialScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.InitialScreen
>

export const SeedlessExportInitial = (): JSX.Element => {
  const { capture } = usePostCapture()
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
    completeExport,
    handleFidoVerify
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
              capture('SeedlessExportPhraseCopied')
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
        const mfaType = await SeedlessService.getMfaType()
        if (mfaType === undefined) {
          Logger.error(`Unsupported MFA type: ${mfaType}`)
          showSimpleToast(`Unsupported MFA type: ${mfaType}`)
          return
        }
        if (mfaType === 'totp') {
          navigate(AppNavigation.SeedlessExport.VerifyCode, {
            userExportResponse: response,
            // @ts-expect-error navigation can't handle generic params well
            onVerifySuccess
          })
          return
        }
        if (mfaType === 'fido') {
          const approved = await handleFidoVerify(response)
          onVerifySuccess(
            approved as CubeSignerResponse<UserExportCompleteResponse>
          )
        }
      }

      await completeExport({ onVerifyMfa }).catch(Logger.error)
    }

    setHideMnemonic(prev => !prev)
    capture(
      !hideMnemonic === true
        ? 'SeedlessExportPhraseHidden'
        : 'SeedlessExportPhraseRevealed'
    )
  }, [
    capture,
    completeExport,
    handleFidoVerify,
    hideMnemonic,
    mnemonic,
    navigate
  ])

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
                  const mfaType = await SeedlessService.getMfaType()
                  if (mfaType === undefined) {
                    Logger.error(`Unsupported MFA type: ${mfaType}`)
                    showSimpleToast(`Unsupported MFA type: ${mfaType}`)
                    return
                  }
                  if (mfaType === 'totp') {
                    navigate(AppNavigation.SeedlessExport.VerifyCode, {
                      userExportResponse: response,
                      // @ts-expect-error navigation can't handle generic params well
                      onVerifySuccess
                    })
                    return
                  }
                  if (mfaType === 'fido') {
                    const approved = await handleFidoVerify(response)
                    onVerifySuccess(
                      approved as CubeSignerResponse<UserExportInitResponse>
                    )
                  }
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

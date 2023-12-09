import Loader from 'components/Loader'
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  ExportState,
  useSeedlessMnemonicExport
} from 'seedless/hooks/useSeedlessMnemonicExport'
import { SeedlessExportScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import {
  CubeSignerResponse,
  UserExportCompleteResponse,
  UserExportInitResponse,
  userExportDecrypt
} from '@cubist-labs/cubesigner-sdk'
import RevealMnemonic from 'navigation/wallet/RevealMnemonic'
import { Button } from '@avalabs/k2-mobile'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'
import { copyToClipboard } from 'utils/DeviceTools'
import Logger from 'utils/Logger'
import SeedlessService from 'seedless/services/SeedlessService'
import { BackButton } from 'components/BackButton'
import { SeedlessExportInstructions } from './SeedlessExportInstructions'
import { RecoveryPhrasePending } from './RecoveryPhrasePending'

type SeedlessExportInitialScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.InitialScreen
>

export const SeedlessExportInitial = (): JSX.Element => {
  const [hideMnemonic, setHideMnemonic] = useState(true)
  const { navigate, replace, setOptions, goBack, canGoBack } =
    useNavigation<SeedlessExportInitialScreenProps['navigation']>()
  const {
    state,
    setState,
    progress,
    mnemonic,
    setMnemonic,
    initExport,
    deleteExport,
    completeExport,
    setPendingRequest,
    timeLeft
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

  const onCompleteExportPromise = useCallback(
    (
      userExportResponse: CubeSignerResponse<UserExportCompleteResponse>,
      privateKey: string
    ): Promise<void> => {
      return new Promise(() => {
        navigate(AppNavigation.SeedlessExport.VerifyCode, {
          userExportResponse,
          onVerifySuccess: async () => {
            const exportDecrypted = await userExportDecrypt(
              privateKey,
              userExportResponse.data()
            )
            const hasMnemonic = 'mnemonic' in exportDecrypted
            // @ts-ignore
            if (!hasMnemonic || typeof exportDecrypted.mnemonic !== 'string') {
              throw new Error('completeExport: missing mnemonic')
            }
            // @ts-ignore
            setMnemonic(exportDecrypted.mnemonic)
            setHideMnemonic(false)
            goBack()
          }
        })
      })
    },
    [goBack, navigate, setMnemonic]
  )

  const onInitExportPromise = (
    userExportResponse: CubeSignerResponse<UserExportInitResponse>
  ): Promise<void> => {
    return new Promise(() => {
      replace(AppNavigation.SeedlessExport.VerifyCode, {
        onVerifySuccess: async () => {
          const pendingExport = await SeedlessService.userExportList()
          setState(ExportState.Pending)
          setPendingRequest(pendingExport)
          goBack()
        },
        userExportResponse
      })
    })
  }

  const toggleRecoveryPhrase = useCallback(async (): Promise<void> => {
    if (mnemonic === undefined) {
      await completeExport(onCompleteExportPromise).catch(Logger.error)
    }
    setHideMnemonic(prev => !prev)
  }, [completeExport, mnemonic, onCompleteExportPromise])

  useEffect(() => {
    if (state === ExportState.Loading) {
      setOptions({ headerShown: false })
    } else {
      setOptions({ headerShown: true })
    }
  }, [setOptions, state])

  return (
    <>
      {state === ExportState.Loading && <Loader />}
      {state === ExportState.NotInitiated && (
        <SeedlessExportInstructions
          onNext={() =>
            navigate(AppNavigation.SeedlessExport.WaitingPeriodModal, {
              onNext: () =>
                initExport(response => onInitExportPromise(response)).catch(
                  Logger.error
                )
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

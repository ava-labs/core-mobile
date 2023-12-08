import Loader from 'components/Loader'
import React, { useEffect } from 'react'
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
import { goBack } from 'utils/Navigation'
import { SeedlessExportInstructions } from './SeedlessExportInstructions'
import { RecoveryPhrasePending } from './RecoveryPhrasePending'

type SeedlessExportInitialScreenProps = SeedlessExportScreenProps<
  typeof AppNavigation.SeedlessExport.InitialScreen
>

export const SeedlessExportInitial = (): JSX.Element => {
  const { navigate, replace, setOptions } =
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

  const onCloseExportRequest = (): void => {
    navigate(AppNavigation.SeedlessExport.ConfirmCloseModal, {
      onCancel: deleteExport
    })
  }

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

  const onCompleteExportPromise = (
    userExportResponse: CubeSignerResponse<UserExportCompleteResponse>,
    privateKey: string
  ): Promise<void> => {
    return new Promise(() => {
      replace(AppNavigation.SeedlessExport.VerifyCode, {
        userExportResponse: userExportResponse,
        onVerifySuccess: async () => {
          console.log('onCompleteExportPromise', userExportResponse.data())
          const exportDecrypted = await userExportDecrypt(
            privateKey,
            userExportResponse.data()
          )
          const hasMnemonic = 'mnemonic' in exportDecrypted
          if (!hasMnemonic || typeof exportDecrypted.mnemonic !== 'string') {
            throw new Error('completeExport: missing mnemonic')
          }
          setMnemonic(exportDecrypted.mnemonic)
          goBack()
        }
      })
    })
  }

  const onInitExportPromise = (
    userExportResponse: CubeSignerResponse<UserExportInitResponse>
  ): Promise<void> => {
    return new Promise(() => {
      console.log('onInitExportPromise', userExportResponse)
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
          completeExport={() => {
            completeExport(onCompleteExportPromise).catch(Logger.error)
          }}
          mnemonic={mnemonic} // west mention cat frog interest lighter ponder vast west book tree pen health dupa chip moral enroll chair hub book pioneer fortune can beautiful
          buttonOverride={buttonOverride()}
          canToggleBlur={true}
          onGoBack={onCloseExportRequest}
        />
      )}
    </>
  )
}

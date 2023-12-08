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
  SignerSessionData,
  UserExportInitResponse,
  userExportDecrypt,
  userExportKeygen
} from '@cubist-labs/cubesigner-sdk'
import RevealMnemonic from 'navigation/wallet/RevealMnemonic'
import { Button } from '@avalabs/k2-mobile'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'
import { copyToClipboard } from 'utils/DeviceTools'
import { OidcPayload } from 'seedless/types'
import { goBack } from 'utils/Navigation'
import Logger from 'utils/Logger'
import SeedlessService from 'seedless/services/SeedlessService'
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
    setPendingRequest
  } = useSeedlessMnemonicExport()

  const onCancelExportRequest = (): void => {
    navigate(AppNavigation.SeedlessExport.ConfirmCancelModal, {
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

  console.log('state', state)

  // const handleCompleteExport = async (): Promise<void> => {
  //   const keyPair = await userExportKeygen()
  //   console.log('completeExport: ', keyPair)
  //   const exportReponse = await SeedlessService.userExportComplete(
  //     keyId,
  //     keyPair.publicKey
  //   )
  //   const cs = await SeedlessService.getCubeSignerClient()
  //   const csResponse = await exportReponse.approve(cs)
  //   if (csResponse.requiresMfa() === false && csResponse.data()) {
  //     const exportDecrypted = await userExportDecrypt(
  //       keyPair.privateKey,
  //       csResponse.data()
  //     )
  //     const hasMnemonic = 'mnemonic' in exportDecrypted
  //     if (!hasMnemonic || typeof exportDecrypted.mnemonic !== 'string') {
  //       throw new Error('completeExport: missing mnemonic')
  //     }
  //     setState(ExportState.Exported)
  //     setMnemonic(exportDecrypted.mnemonic)
  // }

  const onCompleteExportPromise = (
    response: CubeSignerResponse<SignerSessionData>,
    oidcTokenResult: OidcPayload,
    keyId: string
  ): Promise<void> =>
    new Promise(() => {
      replace(AppNavigation.SeedlessExport.VerifyCode, {
        exportInitResponse: response,
        oidcToken: oidcTokenResult.oidcToken,
        mfaId: response.mfaId(),
        onVerifySuccess: async () => {
          debugger
          const keyPair = await userExportKeygen()
          console.log('completeExport: ', keyPair)
          debugger
          const exportReponse = await SeedlessService.userExportComplete(
            keyId,
            keyPair.publicKey
          )
          debugger
          const cs = await SeedlessService.getCubeSignerClient()
          await exportReponse.approve(cs)
          debugger
          const exportDecrypted = await userExportDecrypt(
            keyPair.privateKey,
            exportReponse.data()
          )
          const hasMnemonic = 'mnemonic' in exportDecrypted
          if (!hasMnemonic || typeof exportDecrypted.mnemonic !== 'string') {
            throw new Error('completeExport: missing mnemonic')
          }
          setMnemonic(exportDecrypted.mnemonic)
          setState(ExportState.Exported)
        },
        onBack: () => {}
      })
    })

  const onInitExportPromise = (
    response: CubeSignerResponse<UserExportInitResponse>
    // oidcTokenResult: OidcPayload
  ): Promise<void> =>
    new Promise(() => {
      console.log('onInitExportPromise', response)
      replace(AppNavigation.SeedlessExport.VerifyCode, {
        // oidcToken: oidcTokenResult.oidcToken,
        mfaId: response.mfaId(),
        onVerifySuccess: async () => {
          // const cs = await SeedlessService.getCubeSignerClient()
          // await exportInitResponse.approve(cs)
          const d = response.data()
          setPendingRequest(d)
          debugger
          setState(ExportState.Pending)
          console.log('onInitExportPromise')
        },
        onBack: () => {},
        exportInitResponse: response
      })
    })

  useEffect(() => {
    if (
      state === ExportState.Loading ||
      state === ExportState.Initiating ||
      state === ExportState.Exporting ||
      state === ExportState.Cancelling
    ) {
      setOptions({ headerShown: false })
    } else {
      setOptions({ headerShown: true })
    }
  }, [setOptions, state])

  return (
    <>
      {state === ExportState.Loading && <Loader />}
      {true && (
        <SeedlessExportInstructions
          onNext={() =>
            navigate(AppNavigation.SeedlessExport.WaitingPeriodModal, {
              onNext: () =>
                initExport(
                  response => onInitExportPromise(response),
                  goBack
                ).catch(e => {
                  Logger.error(e)
                })
            })
          }
        />
      )}
      {state === ExportState.Pending && (
        <RecoveryPhrasePending
          onCancel={onCancelExportRequest}
          progress={progress}
        />
      )}
      {state === ExportState.ReadyToExport && (
        <RevealMnemonic
          completeExport={() => {
            completeExport(onCompleteExportPromise, goBack).catch(Logger.error)
          }}
          mnemonic={mnemonic} // west mention cat frog interest lighter ponder vast west book tree pen health dupa chip moral enroll chair hub book pioneer fortune can beautiful
          buttonOverride={buttonOverride()}
          canToggleBlur={true}
          onGoBack={onCancelExportRequest}
        />
      )}
    </>
  )
}

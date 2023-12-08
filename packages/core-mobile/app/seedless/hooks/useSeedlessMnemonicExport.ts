import {
  CubeSignerResponse,
  SignerSessionData,
  UserExportInitResponse,
  userExportDecrypt,
  userExportKeygen
} from '@cubist-labs/cubesigner-sdk'
import { getEnvironment } from '@walletconnect/utils'
import { useCallback, useEffect, useState } from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import { OidcPayload } from 'seedless/types'
import { refreshSeedlessTokenFlow } from 'seedless/utils/refreshSeedlessTokenFlow'
import Logger from 'utils/Logger'

export enum ExportState {
  Loading,
  NotInitiated,
  Initiating,
  Pending,
  ReadyToExport,
  Exporting,
  Exported,
  Error,
  Cancelling
}

export enum ExportErrorCode {
  FailedToInitialize,
  FailedToComplete,
  FailedToCancel,
  RequestOutdated
}

const HOURS_48 = 60 * 60 * 48
const ONE_MINUTE = 60
const EXPORT_DELAY = getEnvironment() ? HOURS_48 : ONE_MINUTE

interface ReturnProps {
  state: ExportState
  setState: (state: ExportState) => void
  initExport: (
    onVerifySuccessPromise: (
      loginResult: CubeSignerResponse<SignerSessionData>,
      oidcTokenResult: OidcPayload,
      keyId: string
    ) => Promise<void>,
    onGoBack: () => void
  ) => Promise<void>
  completeExport: (
    onVerifySuccessPromise: (
      loginResult: CubeSignerResponse<SignerSessionData>,
      oidcTokenResult: OidcPayload,
      keyId: string
    ) => Promise<void>,
    onGoBack: () => void
  ) => Promise<void>
  deleteExport: () => void
  mnemonic?: string
  setMnemonic: (mnemonic?: string) => void
  progress: number
  setPendingRequest: (pendingRequest?: UserExportInitResponse) => void
}

export const useSeedlessMnemonicExport = (): ReturnProps => {
  const [pendingRequest, setPendingRequest] = useState<UserExportInitResponse>()
  const [mnemonic, setMnemonic] = useState<string>()
  const [state, setState] = useState<ExportState>(ExportState.Loading)
  const [error, setError] = useState<ExportErrorCode>()
  const [progress, setProgress] = useState(0)
  const [keyId, setKeyId] = useState('')
  const [timeLeft, setTimeLeft] = useState('')

  // const completeExport = async (
  //   onCompleteExport: () => void
  // ): Promise<void> => {
  //   setState(ExportState.Exporting)
  //   setMnemonic('')
  //   try {
  //     const keyPair = await userExportKeygen()
  //     const exportReponse = await SeedlessService.userExportComplete(
  //       keyId,
  //       keyPair.publicKey
  //     )
  //     if (exportReponse.requiresMfa()) {
  //       const cs = await SeedlessService.getCubeSignerClient()
  //       const csResponse = await exportReponse.approve(cs)
  //       if (csResponse.requiresMfa() === false && csResponse.data()) {
  //         const exportDecrypted = await userExportDecrypt(
  //           keyPair.privateKey,
  //           csResponse.data()
  //         )
  //         const hasMnemonic = 'mnemonic' in exportDecrypted
  //         if (!hasMnemonic || typeof exportDecrypted.mnemonic !== 'string') {
  //           throw new Error('completeExport: missing mnemonic')
  //         }
  //         setMnemonic(exportDecrypted.mnemonic)
  //         onCompleteExport()
  //       }
  //       throw new Error('completeExport: requiresMfa')
  //     }
  //   } catch (e) {
  //     Logger.error('failed to complete export request error: ', e)
  //     setState(ExportState.Error)
  //   }
  // }

  const completeExport = useCallback(
    async (
      onVerifySuccessPromise: (
        onVerifySuccessPromise: (
          response: CubeSignerResponse<UserExportInitResponse>,
          oidcTokenResult: OidcPayload,
          keyId: string
        ) => Promise<void>,
        onGoBack: () => void
      ) => Promise<void>,
      onGoBack: () => void
    ): Promise<void> => {
      setState(ExportState.Exporting)
      setMnemonic(undefined)
      try {
        refreshSeedlessTokenFlow(
          (_reponse, oidcToken) => onVerifySuccessPromise(_reponse, oidcToken),
          onGoBack
        )
      } catch (e) {
        setState(ExportState.Error)
        setError(ExportErrorCode.FailedToComplete)
        Logger.error('failed to complete export request error: ', e)
      }
    },
    [keyId]
  )

  // const deleteExport = async (): Promise<void> => {
  //   try {
  //     await SeedlessService.userExportDelete(keyId)
  //     setMnemonic('')
  //     setState(ExportState.NotInitiated)
  //   } catch (e) {
  //     Logger.error('failed to cdelete export request error: ', e)
  //     setState(ExportState.Error)
  //   }
  // }
  const deleteExport = useCallback(async (): Promise<void> => {
    setState(ExportState.Cancelling)

    try {
      const pending = await SeedlessService.userExportList()
      if (!pending) {
        throw new Error('deleteExport: no pending')
      }
      await SeedlessService.userExportDelete(keyId)
      setPendingRequest(undefined)
      setMnemonic(undefined)
      setState(ExportState.NotInitiated)
    } catch (e) {
      setState(ExportState.Error)
      setError(ExportErrorCode.FailedToCancel)
      Logger.error('failed to cdelete export request error: ', e)
    }
  }, [keyId])

  // const initExport = async (
  //   onVerifySuccessPromise: (
  //     response: CubeSignerResponse<SignerSessionData>,
  //     oidcTokenResult: OidcPayload
  //   ) => Promise<void>,
  //   onGoBack: () => void
  // ): Promise<void> => {
  //   try {
  //     const pending = await SeedlessService.userExportList()
  //     if (pending) {
  //       setPendingRequest(pending)
  //       setState(ExportState.Pending)
  //       console.log('initExport:pendingRequest in progress', pending)
  //     }

  //     const exportInitResponse = await SeedlessService.userExportInit(keyId)
  //     if (exportInitResponse.requiresMfa()) {
  //       refreshSeedlessTokenFlow(onVerifySuccessPromise, onGoBack).catch(() =>
  //         Logger.error('initExport:refreshSeedlessTokenFlow')
  //       )
  //       const cs = await SeedlessService.getCubeSignerClient()
  //       const csResponse = await exportInitResponse.approve(cs)
  //       console.log('initalExport:approve', csResponse.requiresMfa())
  //       // if (csResponse.requiresMfa() === false && csResponse.data()) {
  //       //   setPendingRequest(exportInitResponse.data())
  //       //   setState(ExportState.Pending)
  //       //   return
  //       // }
  //       // throw new Error('WaitingPeriodModal: requiresMfa')
  //     }
  //     // setPendingRequest(exportInitResponse.data())
  //     // setState(ExportState.Pending)
  //     // onShowPending(exportInitResponse.data())
  //   } catch (e) {
  //     Logger.error('WaitingPeriodModal error: ', e)
  //   }
  // }

  // const onVerified = useCallback(async () => {
  //   const cs = await SeedlessService.getCubeSignerClient()
  //   const csResponse = await response.approve(cs)
  //   setPendingRequest(csResponse.data())
  //   setState(ExportState.Pending)
  // }, [])

  const initExport = useCallback(
    async (
      onVerifySuccessPromise: (
        response: CubeSignerResponse<UserExportInitResponse>
        // oidcTokenResult: OidcPayload
        // keyId: string
      ) => Promise<void>,
      onGoBack: () => void
    ): Promise<void> => {
      setState(ExportState.Initiating)
      try {
        const pending = await SeedlessService.userExportList()
        if (pending) {
          throw new Error('initExport:pendingRequest in progress')
        }
        const exportInitResponse = await SeedlessService.userExportInit(keyId)
        debugger
        console.log('keyId', keyId)
        console.log('exportInitResponse', exportInitResponse)
        if (exportInitResponse.requiresMfa()) {
          onVerifySuccessPromise(exportInitResponse)
          return
        }

        // refreshSeedlessTokenFlow(
        //   (reponse, oidcToken) =>
        //     onVerifySuccessPromise(reponse, oidcToken, keyId),
        //   onGoBack
        // ).catch(() => Logger.error('initExport:refreshSeedlessTokenFlow'))
        // if (exportInitResponse.requiresMfa()) {
        //   refreshSeedlessTokenFlow(onVerifySuccessPromise, onGoBack).catch(() =>
        //     Logger.error('initExport:refreshSeedlessTokenFlow')
        //   )
        // }
        setPendingRequest(exportInitResponse.data())
      } catch (e) {
        Logger.error('initExport error: ', e)
      }
    },
    [keyId]
  )

  const updateProgress = useCallback(async () => {
    if (!pendingRequest) {
      setState(ExportState.NotInitiated)
      return
    }
    if (state === ExportState.Exporting || state === ExportState.Exported) {
      return
    }

    const { valid_epoch: availableAt, exp_epoch: availableUntil } =
      pendingRequest

    const isInProgress = Date.now() / 1000 < availableAt

    const isReadyToDecrypt =
      Date.now() / 1000 >= availableAt && Date.now() / 1000 <= availableUntil
    const secondsPassed = EXPORT_DELAY - (availableAt - Date.now() / 1000)

    console.log(
      'updateProgress: ',
      isInProgress,
      isReadyToDecrypt,
      secondsPassed
    )
    if (isInProgress) {
      setState(ExportState.Pending)
    } else if (isReadyToDecrypt) {
      setState(ExportState.ReadyToExport)
    } else {
      await SeedlessService.userExportDelete(keyId)
      setState(ExportState.NotInitiated)
    }

    setProgress(
      Math.min(Math.max(0, (secondsPassed / EXPORT_DELAY) * 100), 100)
    )
  }, [pendingRequest, state])

  useEffect(() => {
    const checkPendingExports = async (): Promise<void> => {
      const keysList = await SeedlessService.getSessoinKeysList()

      const id = keysList[0]?.key_id
      if (id) {
        setKeyId(id)
      }
      const pendingExport = await SeedlessService.userExportList()
      console.log('pendingExport', pendingExport)
      setState(pendingExport ? ExportState.Pending : ExportState.NotInitiated)
      setPendingRequest(pendingExport)
    }
    checkPendingExports()
  }, [])

  useEffect(() => {
    if (!pendingRequest) {
      return
    }
    updateProgress()
    if (state === ExportState.Pending) {
      const timer = setInterval(updateProgress, 5000)
      return () => {
        clearInterval(timer)
      }
    }
  }, [pendingRequest, updateProgress, state])

  return {
    state,
    setState,
    initExport,
    completeExport,
    deleteExport,
    mnemonic,
    setMnemonic,
    progress,
    setPendingRequest
  }
}

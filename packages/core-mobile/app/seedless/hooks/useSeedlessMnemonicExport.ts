import {
  CubeSignerResponse,
  UserExportCompleteResponse,
  UserExportInitResponse
} from '@cubist-labs/cubesigner-sdk'
import { showSimpleToast } from 'components/Snackbar'
import { formatDistanceToNow } from 'date-fns'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { useCallback, useEffect, useState } from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import { UserExportResponse } from 'seedless/types'
import PasskeyService from 'services/passkey/PasskeyService'
import Logger from 'utils/Logger'

export enum ExportState {
  Loading,
  NotInitiated,
  Pending,
  ReadyToExport
}

const HOURS_48 = 60 * 60 * 48
const ONE_MINUTE = 60

const EXPORT_DELAY =
  SeedlessService.getEnvironment() === 'prod' ? HOURS_48 : ONE_MINUTE

type OnVerifyMfaSuccess<T> = (response: T) => Promise<void>

type UserExportOnVerifyMfa<T extends UserExportResponse> = (
  response: T,
  onVerifySuccess: OnVerifyMfaSuccess<T>
) => void

export type InitExportOnVerifyMfa = UserExportOnVerifyMfa<
  CubeSignerResponse<UserExportInitResponse>
>

export type CompleteExportOnVerifyMfa = UserExportOnVerifyMfa<
  CubeSignerResponse<UserExportCompleteResponse>
>

interface ReturnProps {
  state: ExportState
  timeLeft: string
  progress: number
  mnemonic?: string
  initExport: ({
    onVerifyMfa
  }: {
    onVerifyMfa: InitExportOnVerifyMfa
  }) => Promise<void>
  completeExport: ({
    onVerifyMfa
  }: {
    onVerifyMfa: CompleteExportOnVerifyMfa
  }) => Promise<void>
  deleteExport: () => void
  handleFidoVerify: (
    reponse: UserExportResponse
  ) => Promise<UserExportResponse | undefined>
}

export const useSeedlessMnemonicExport = (): ReturnProps => {
  const { capture } = usePostCapture()
  const [pendingRequest, setPendingRequest] = useState<UserExportInitResponse>()
  const [mnemonic, setMnemonic] = useState<string>()
  const [state, setState] = useState<ExportState>(ExportState.Loading)
  const [progress, setProgress] = useState(0)
  const [keyId, setKeyId] = useState('')
  const [timeLeft, setTimeLeft] = useState('')

  const completeExport = useCallback(
    async ({
      onVerifyMfa
    }: {
      onVerifyMfa: CompleteExportOnVerifyMfa
    }): Promise<void> => {
      setMnemonic(undefined)
      try {
        const keyPair = await SeedlessService.userExportGenerateKeyPair()
        const exportReponse = await SeedlessService.userExportComplete(
          keyId,
          keyPair.publicKey
        )

        if (!exportReponse.requiresMfa()) {
          throw new Error('completeExport:must require mfa')
        }

        const onVerifySuccess: OnVerifyMfaSuccess<
          CubeSignerResponse<UserExportCompleteResponse>
        > = async response => {
          capture('SeedlessExportCompleted')
          const decryptedMnemonic = await SeedlessService.userExportDecrypt(
            keyPair.privateKey,
            response.data()
          )
          setMnemonic(decryptedMnemonic)
        }

        onVerifyMfa(exportReponse, onVerifySuccess)
      } catch (e) {
        Logger.error('failed to complete export request error: ', e)
        capture('SeedlessExportCompleteFailed')
        showSimpleToast('Unable to complete export request')
      }
    },
    [capture, keyId]
  )

  const deleteExport = useCallback(async (): Promise<void> => {
    try {
      const pending = await SeedlessService.userExportList()
      if (!pending) {
        throw new Error('deleteExport: no pending export request')
      }
      await SeedlessService.userExportDelete(keyId)
      setPendingRequest(undefined)
      setMnemonic(undefined)
      setState(ExportState.NotInitiated)
      capture('SeedlessExportCancelled')
    } catch (e) {
      Logger.error('failed to delete export request error: ', e)
      capture('SeedlessExportCancelFailed')
      showSimpleToast('Unable to delete export request')
    }
  }, [capture, keyId])

  const initExport = useCallback(
    async ({
      onVerifyMfa
    }: {
      onVerifyMfa: InitExportOnVerifyMfa
    }): Promise<void> => {
      try {
        const pending = await SeedlessService.userExportList()

        if (pending) {
          throw new Error('initExport:pendingRequest in progress')
        }

        const exportInitResponse = await SeedlessService.userExportInit(keyId)

        if (!exportInitResponse.requiresMfa()) {
          throw new Error('initExport:must require mfa')
        }
        const onVerifySuccess: OnVerifyMfaSuccess<
          CubeSignerResponse<UserExportInitResponse>
        > = async response => {
          setPendingRequest(response.data())
          setState(ExportState.Pending)
          capture('SeedlessExportInitiated')
        }
        onVerifyMfa(exportInitResponse, onVerifySuccess)
      } catch (e) {
        Logger.error('initExport error: ', e)
        capture('SeedlessExportInitiateFailed')
        showSimpleToast('Unable to start export request')
      }
    },
    [capture, keyId]
  )

  const handleFidoVerify = async (
    response: UserExportResponse
  ): Promise<UserExportResponse | undefined> => {
    try {
      const challenge = await SeedlessService.fidoApproveStart(response.mfaId())
      const credential = await PasskeyService.authenticate(
        challenge.options,
        true
      )
      const mfaRequestInfo = await challenge.answer(credential)

      if (!mfaRequestInfo.receipt?.confirmation) {
        throw new Error('FIDO authentication failed')
      }
      return SeedlessService.signWithMfaApproval(
        response,
        mfaRequestInfo.receipt.confirmation
      )
    } catch (e) {
      Logger.error('handleFidoVerify error: ', e)
      showSimpleToast('FIDO authentication failed')
    }
  }

  const updateProgress = useCallback(async () => {
    if (!pendingRequest) {
      setState(ExportState.NotInitiated)
      return
    }

    const { valid_epoch: availableAt, exp_epoch: availableUntil } =
      pendingRequest

    const isInProgress = Date.now() / 1000 < availableAt

    const isReadyToDecrypt =
      Date.now() / 1000 >= availableAt && Date.now() / 1000 <= availableUntil
    const secondsPassed = EXPORT_DELAY - (availableAt - Date.now() / 1000)

    if (isInProgress) {
      setState(ExportState.Pending)
      setTimeLeft(formatDistanceToNow(new Date(availableAt * 1000)))
    } else if (isReadyToDecrypt) {
      setState(ExportState.ReadyToExport)
      setTimeLeft(formatDistanceToNow(new Date(availableUntil * 1000)))
    } else {
      await SeedlessService.userExportDelete(keyId)
      setState(ExportState.NotInitiated)
    }

    setProgress(
      Math.min(Math.max(0, (secondsPassed / EXPORT_DELAY) * 100), 100)
    )
  }, [keyId, pendingRequest])

  useEffect(() => {
    const checkPendingExports = async (): Promise<void> => {
      const keysList = await SeedlessService.getSessionKeysList()
      const id = keysList[0]?.key_id
      if (id) {
        setKeyId(id)
      }
      const pendingExport = await SeedlessService.userExportList()
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
    timeLeft,
    progress,
    mnemonic,
    initExport,
    completeExport,
    deleteExport,
    handleFidoVerify
  }
}

export const getDelayInstruction = (): string => {
  return `Wait ${
    EXPORT_DELAY === HOURS_48 ? '2 days' : '1 minute'
  } to retrieve phrase`
}

export const getDelayWarningTitle = (): string => {
  return `${EXPORT_DELAY === HOURS_48 ? '2 Day' : '1 Minute'} Waiting Period`
}

export const getDelayWarningDescription = (): string => {
  return `For your safety there is a ${
    EXPORT_DELAY === HOURS_48 ? '2 day' : '1 minute'
  } waiting period to retrieve a phrase`
}

export const getWaitingPeriodDescription = (): string => {
  const is2Days = EXPORT_DELAY === HOURS_48
  return `It will take ${
    is2Days ? '2 days' : '1 minute'
  } to retrieve your recovery phrase. You will only have ${
    is2Days ? '48 hours' : '1 minute'
  } to copy your recovery phrase once the ${
    is2Days ? '2 day' : '1 minute'
  } waiting period is over.`
}

export const getConfirmCancelDelayText = (): string => {
  return `Canceling will require you to restart the ${
    EXPORT_DELAY === HOURS_48 ? '2 day' : '1 minute'
  } waiting period.`
}

export const getConfirmCloseDelayText = (): string => {
  return `Closing the settings menu will require you to restart the ${
    EXPORT_DELAY === HOURS_48 ? '2 day' : '1 minute'
  } waiting period.`
}

import {
  CubeSignerResponse,
  UserExportCompleteResponse,
  UserExportInitResponse,
  userExportKeygen
} from '@cubist-labs/cubesigner-sdk'
import { getEnvironment } from '@walletconnect/utils'
import { formatDistanceToNow, fromUnixTime } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

export enum ExportState {
  Loading,
  NotInitiated,
  Pending,
  ReadyToExport
}

const HOURS_48 = 60 * 60 * 48
const ONE_MINUTE = 60
const EXPORT_DELAY = getEnvironment() ? HOURS_48 : ONE_MINUTE

interface ReturnProps {
  state: ExportState
  setState: (state: ExportState) => void
  initExport: (
    onVerifySuccessPromise: (
      response: CubeSignerResponse<UserExportInitResponse>
    ) => Promise<void>
  ) => Promise<void>
  completeExport: (
    onVerifySuccessPromise: (
      response: CubeSignerResponse<UserExportCompleteResponse>,
      privateKey: string
    ) => Promise<void>
  ) => Promise<void>
  deleteExport: () => void
  mnemonic?: string
  setMnemonic: (mnemonic?: string) => void
  progress: number
  setPendingRequest: (pendingRequest?: UserExportInitResponse) => void
  timeLeft: string
}

export const useSeedlessMnemonicExport = (): ReturnProps => {
  const [pendingRequest, setPendingRequest] = useState<UserExportInitResponse>()
  const [mnemonic, setMnemonic] = useState<string>()
  const [state, setState] = useState<ExportState>(ExportState.Loading)
  const [progress, setProgress] = useState(0)
  const [keyId, setKeyId] = useState('')
  const [timeLeft, setTimeLeft] = useState('')

  const completeExport = useCallback(
    async (
      onVerifySuccessPromise: (
        response: CubeSignerResponse<UserExportCompleteResponse>,
        privateKey: string
      ) => Promise<void>
    ): Promise<void> => {
      setMnemonic(undefined)
      try {
        const keyPair = await userExportKeygen()
        console.log('completeExport: ', keyPair)
        console.log('completeExport:keyId ', keyId)

        const exportReponse = await SeedlessService.userExportComplete(
          keyId,
          keyPair.publicKey
        )
        if (exportReponse.requiresMfa()) {
          onVerifySuccessPromise(exportReponse, keyPair.privateKey)
        }
      } catch (e) {
        Logger.error('failed to complete export request error: ', e)
      }
    },
    [keyId]
  )

  const deleteExport = useCallback(async (): Promise<void> => {
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
      Logger.error('failed to cdelete export request error: ', e)
    }
  }, [keyId])

  const initExport = useCallback(
    async (
      onVerifySuccessPromise: (
        response: CubeSignerResponse<UserExportInitResponse>
      ) => Promise<void>
    ): Promise<void> => {
      try {
        const pending = await SeedlessService.userExportList()
        if (pending) {
          throw new Error('initExport:pendingRequest in progress')
        }
        const exportInitResponse = await SeedlessService.userExportInit(keyId)
        console.log('keyId', keyId)
        console.log('exportInitResponse', exportInitResponse)
        if (exportInitResponse.requiresMfa()) {
          onVerifySuccessPromise(exportInitResponse)
          return
        }
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

    const { valid_epoch: availableAt, exp_epoch: availableUntil } =
      pendingRequest

    console.log(
      'updateProgress: ',
      fromUnixTime(availableAt),
      fromUnixTime(availableUntil)
    )

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
      const keysList = await SeedlessService.getSessoinKeysList()
      const id = keysList[0]?.key_id
      if (id) {
        setKeyId(id)
      }
      // deleteExport(id)
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
    setPendingRequest,
    timeLeft
  }
}

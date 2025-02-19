import {
  UserExportCompleteResponse,
  UserExportInitResponse
} from '@cubist-labs/cubesigner-sdk'
import { showSimpleToast } from 'components/Snackbar'
import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import SeedlessExportService from 'seedless/services/SeedlessExportService'
import SeedlessSession from 'seedless/services/SeedlessSession'
import { startRefreshSeedlessTokenFlow } from 'seedless/utils/startRefreshSeedlessTokenFlow'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import * as Navigation from 'utils/Navigation'
import { Alert } from 'react-native'
import useVerifyMFA from './useVerifyMFA'

export enum ExportState {
  Loading,
  NotInitiated,
  Pending,
  ReadyToExport
}

const HOURS_48 = 60 * 60 * 48
const ONE_MINUTE = 60

const EXPORT_DELAY =
  SeedlessSession.environment === 'prod' ? HOURS_48 : ONE_MINUTE

type OnVerifyMfaSuccess<T> = (response: T) => void

interface ReturnProps {
  state: ExportState
  timeLeft: string
  progress: number
  mnemonic?: string
  initExport: () => Promise<void>
  completeExport: () => Promise<void>
  deleteExport: () => void
}

export const useSeedlessMnemonicExport = (keyId: string): ReturnProps => {
  const [pendingRequest, setPendingRequest] = useState<UserExportInitResponse>()
  const [mnemonic, setMnemonic] = useState<string>()
  const [state, setState] = useState<ExportState>(ExportState.Loading)
  const [progress, setProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState('')

  const seedlessExportService = useMemo(() => new SeedlessExportService(), [])
  const { verifyMFA } = useVerifyMFA(seedlessExportService.session)

  const deleteExport = useCallback(async (): Promise<void> => {
    try {
      const pending = await seedlessExportService.userExportList()
      if (!pending) {
        Logger.error('deleteExport: no pending export request')
        return
      }
      await seedlessExportService.userExportDelete(keyId)
      setPendingRequest(undefined)
      setMnemonic(undefined)
      setState(ExportState.NotInitiated)
      AnalyticsService.capture('SeedlessExportCancelled')
    } catch (e) {
      Logger.error('failed to delete export request error: ', e)
      AnalyticsService.capture('SeedlessExportCancelFailed')
      showSimpleToast('Unable to delete export request')
    }
  }, [keyId, seedlessExportService])

  const initExport = useCallback(async (): Promise<void> => {
    try {
      const pending = await seedlessExportService.userExportList()

      if (pending) {
        throw new Error('initExport:pendingRequest in progress')
      }

      const exportInitResponse = await seedlessExportService.userExportInit(
        keyId
      )

      if (!exportInitResponse.requiresMfa()) {
        throw new Error('initExport:must require mfa')
      }
      const onVerifySuccess: OnVerifyMfaSuccess<
        UserExportInitResponse
      > = pendingExportInitResponse => {
        setPendingRequest(pendingExportInitResponse)
        setState(ExportState.Pending)
      }
      verifyMFA({ response: exportInitResponse, onVerifySuccess })
    } catch (e) {
      Logger.error('initExport error: ', e)
      showSimpleToast('Unable to start export request')
    }
  }, [keyId, verifyMFA, seedlessExportService])

  const completeExport = useCallback(async (): Promise<void> => {
    setMnemonic(undefined)
    try {
      const keyPair = await seedlessExportService.userExportGenerateKeyPair()
      const exportReponse = await seedlessExportService.userExportComplete(
        keyId,
        keyPair.publicKey
      )

      if (!exportReponse.requiresMfa()) {
        throw new Error('completeExport:must require mfa')
      }

      const onVerifySuccess: OnVerifyMfaSuccess<
        UserExportCompleteResponse
      > = async userExportCompleteResponse => {
        const decryptedMnemonic = await seedlessExportService.userExportDecrypt(
          keyPair.privateKey,
          userExportCompleteResponse
        )
        setMnemonic(decryptedMnemonic)
      }

      verifyMFA({ response: exportReponse, onVerifySuccess })
    } catch (e) {
      Logger.error('failed to complete export request error: ', e)
      showSimpleToast('Unable to complete export request')
    }
  }, [keyId, verifyMFA, seedlessExportService])

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
      await seedlessExportService.userExportDelete(keyId)
      setState(ExportState.NotInitiated)
    }

    setProgress(
      Math.min(Math.max(0, (secondsPassed / EXPORT_DELAY) * 100), 100)
    )
  }, [keyId, pendingRequest, seedlessExportService])

  useEffect(() => {
    const checkPendingExports = async (): Promise<void> => {
      const mfa = await seedlessExportService.session.userMfa()
      if (mfa.length === 0) {
        Alert.alert(
          'Multi-factor authentication required',
          'Please set up at least one in Settings > Security & Privacy > Recovery Methods.',
          [
            {
              text: 'OK',
              onPress: () => {
                Navigation.goBack()
              }
            }
          ],
          { cancelable: false }
        )
        return
      }

      const pendingExport = await seedlessExportService.userExportList()
      setState(pendingExport ? ExportState.Pending : ExportState.NotInitiated)
      setPendingRequest(pendingExport)
    }

    startRefreshSeedlessTokenFlow(seedlessExportService.session)
      .then(result => {
        if (result.success) {
          checkPendingExports()
        } else {
          if (result.error.name !== 'USER_CANCELED') {
            showSimpleToast('Unable to start export request. Please try again.')
          }
          Navigation.goBack()
        }
      })
      .catch(e => {
        Logger.error('startRefreshSeedlessTokenFlow error', e)
        showSimpleToast('Unable to start export request. Please try again.')
        Navigation.goBack()
      })
  }, [seedlessExportService])

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
    deleteExport
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

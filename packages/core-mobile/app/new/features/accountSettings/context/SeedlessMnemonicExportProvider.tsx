import React, {
  useState,
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect
} from 'react'
import SeedlessSession from 'seedless/services/SeedlessSession'
import SeedlessExportService from 'seedless/services/SeedlessExportService'
import {
  CubeSignerResponse,
  UserExportCompleteResponse,
  UserExportInitResponse
} from '@cubist-labs/cubesigner-sdk'
import { useVerifyRecoveryMethods } from 'common/hooks/useVerifyRecoveryMethods'
import { startRefreshSeedlessTokenFlow } from 'common/utils/startRefreshSeedlessTokenFlow'
import { useRouter } from 'expo-router'
import { showAlert } from '@avalabs/k2-alpine'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { showSnackbar } from 'common/utils/toast'
import SeedlessService from 'seedless/services/SeedlessService'
import { getExportInitProgress } from '../utils/getExportInitProgress'

const HOURS_48 = 60 * 60 * 48
const ONE_MINUTE = 60

export const EXPORT_DELAY =
  SeedlessSession.environment === 'prod' ? HOURS_48 : ONE_MINUTE

type OnVerifyMfaSuccess<T> = (response: T) => void

type SeedlessExportSessionData = {
  isMfaRequired: boolean
  oidcToken: string
  mfaId: string
}

export interface SeedlessMnemonicExportState {
  sessionData?: SeedlessExportSessionData
  seedlessExportService: SeedlessExportService
  authenticate: () => Promise<void>
  mnemonic?: string
  initExport: () => Promise<void>
  completeExport: () => Promise<void>
  deleteExport: () => Promise<void>
  checkPendingExports: () => Promise<void>
  userExportInitResponse?: CubeSignerResponse<UserExportInitResponse>
  userExportCompleteResponse?: CubeSignerResponse<UserExportCompleteResponse>
  onVerifyExportInitSuccess: OnVerifyMfaSuccess<UserExportInitResponse>
  onVerifyExportCompleteSuccess: OnVerifyMfaSuccess<UserExportCompleteResponse>
  pendingRequest?: UserExportInitResponse
}

export const SeedlessMnemonicExportContext =
  createContext<SeedlessMnemonicExportState>({} as SeedlessMnemonicExportState)

export const SeedlessMnemonicExportProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const seedlessExportService = useMemo(() => new SeedlessExportService(), [])
  const [pendingRequest, setPendingRequest] = useState<UserExportInitResponse>()
  const [mnemonic, setMnemonic] = useState<string>()
  const { verifyMFA } = useVerifyRecoveryMethods(seedlessExportService.session)
  const { canGoBack, back, navigate, replace } = useRouter()
  const [keyId, setKeyId] = useState<string>('')
  const [keyPair, setKeyPair] = useState<CryptoKeyPair>()

  const [userExportInitResponse, setUserExportInitResponse] = useState<
    CubeSignerResponse<UserExportInitResponse> | undefined
  >()
  const [userExportCompleteResponse, setUserExportCompleteResponse] = useState<
    CubeSignerResponse<UserExportCompleteResponse> | undefined
  >()

  const [sessionData, setSessionData] = useState<SeedlessExportSessionData>()

  const onVerifyExportInitSuccess = useCallback(
    (response: UserExportInitResponse) => {
      setPendingRequest(response)
      setTimeout(() => {
        replace('./pending')
      }, 100)
    },
    [replace]
  )

  const onVerifyExportCompleteSuccess = useCallback(
    async (response: UserExportCompleteResponse) => {
      if (keyPair?.privateKey === undefined) {
        return
      }
      const decryptedMnemonic = await seedlessExportService.userExportDecrypt(
        keyPair.privateKey,
        response
      )
      setMnemonic(decryptedMnemonic)
    },
    [keyPair?.privateKey, seedlessExportService]
  )

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
      setKeyPair(undefined)
      AnalyticsService.capture('SeedlessExportCancelled')
    } catch (e) {
      Logger.error('failed to delete export request error: ', e)
      AnalyticsService.capture('SeedlessExportCancelFailed')
      showSnackbar('Unable to delete export request')
    }
  }, [keyId, seedlessExportService])

  const checkPendingExports = useCallback(async (): Promise<void> => {
    const pendingExport = await seedlessExportService.userExportList()
    if (pendingExport) {
      const progress = getExportInitProgress(
        pendingExport.valid_epoch,
        pendingExport.exp_epoch
      )
      if (progress.isInProgress) {
        replace('./seedlessExportPhrase/pending')
        return
      }
      if (progress.isReadyToDecrypt) {
        replace('./seedlessExportPhrase/readyToExport')
        return
      }
      if (progress.isExpired) {
        deleteExport()
        setPendingRequest(undefined)
        replace('./seedlessExportPhrase/notInitiated')
      }
    } else {
      replace('./seedlessExportPhrase/notInitiated')
    }
  }, [deleteExport, replace, seedlessExportService])

  const handleNoMfaMethods = useCallback((): void => {
    showAlert({
      title: 'Multi-factor authentication required',
      description:
        'Please set up at least one in Settings > Security & privacy > Recovery methods.',
      buttons: [
        {
          text: 'Ok',
          onPress: () => canGoBack() && back()
        }
      ]
    })
  }, [back, canGoBack])

  const authenticate = useCallback(async (): Promise<void> => {
    const result = await startRefreshSeedlessTokenFlow(
      seedlessExportService.session
    )
    if (result.success) {
      setSessionData(result.value)
      const mfaMethods = await seedlessExportService.session.userMfa()
      if (mfaMethods.length === 0) {
        handleNoMfaMethods()
        return
      }
      if (mfaMethods.length === 1) {
        const mfa = mfaMethods[0]
        if (mfa?.type === 'totp') {
          navigate('./seedlessExportPhrase/refreshSeedlessToken/verifyTotpCode')
          return
        } else {
          await seedlessExportService.session.approveFido(
            result.value.oidcToken,
            result.value.mfaId,
            true
          )
          checkPendingExports()
          return
        }
      }
      navigate('./seedlessExportPhrase/refreshSeedlessToken/selectMfaMethod')
      return
    }
    canGoBack() && back()
  }, [
    back,
    canGoBack,
    checkPendingExports,
    handleNoMfaMethods,
    navigate,
    seedlessExportService.session
  ])

  useEffect(() => {
    const getKeyId = async (): Promise<void> => {
      const key = await SeedlessService.getMnemonicKeysList()
      key?.key_id && setKeyId(key.key_id)
    }
    getKeyId()
  }, [seedlessExportService, setKeyId])

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
      setUserExportInitResponse(exportInitResponse)
      verifyMFA({
        response: exportInitResponse,
        verifyMfaPath: 'verifyExportInitMfa',
        onVerifySuccess: onVerifyExportInitSuccess
      })
    } catch (e) {
      Logger.error('initExport error: ', e)
      showSnackbar('Unable to start export request')
    }
  }, [seedlessExportService, keyId, verifyMFA, onVerifyExportInitSuccess])

  const completeExport = useCallback(async (): Promise<void> => {
    setMnemonic(undefined)
    try {
      const kp = await seedlessExportService.userExportGenerateKeyPair()
      setKeyPair(kp)
      const exportReponse = await seedlessExportService.userExportComplete(
        keyId,
        kp.publicKey
      )

      if (!exportReponse.requiresMfa()) {
        throw new Error('completeExport:must require mfa')
      }
      setUserExportCompleteResponse(exportReponse)
      verifyMFA({
        response: exportReponse,
        verifyMfaPath: 'verifyExportCompleteMfa',
        onVerifySuccess: onVerifyExportCompleteSuccess
      })
    } catch (e) {
      Logger.error('failed to complete export request error: ', e)
      showSnackbar('Unable to complete export request')
    }
  }, [seedlessExportService, keyId, verifyMFA, onVerifyExportCompleteSuccess])

  return (
    <SeedlessMnemonicExportContext.Provider
      value={{
        sessionData,
        seedlessExportService,
        authenticate,
        mnemonic,
        initExport,
        completeExport,
        deleteExport,
        checkPendingExports,
        userExportInitResponse,
        userExportCompleteResponse,
        onVerifyExportInitSuccess,
        onVerifyExportCompleteSuccess,
        pendingRequest
      }}>
      {children}
    </SeedlessMnemonicExportContext.Provider>
  )
}

export function useSeedlessMnemonicExportContext(): SeedlessMnemonicExportState {
  return useContext(SeedlessMnemonicExportContext)
}

export const getDelayInstruction = (): string => {
  return `Wait ${
    EXPORT_DELAY === HOURS_48 ? '2 days' : '1 minute'
  } to retrieve phrase`
}

export const getDelayWarningDescription = (): string => {
  return `For your safety, there is a ${
    EXPORT_DELAY === HOURS_48 ? '2 days' : '1 minute'
  } waiting period to retrieve a recovery phrase`
}

export const getWaitingPeriodDescription = (): string => {
  const is2Days = EXPORT_DELAY === HOURS_48
  return `It will take ${
    is2Days ? '2 days' : '1 minute'
  } to retrieve your recovery phrase. You will only have ${
    is2Days ? '48 hours' : '1 minute'
  } to copy your recovery phrase once the ${
    is2Days ? '2 days' : '1 minute'
  } waiting period is over.`
}

export const getConfirmCancelDelayText = (): string => {
  return `Canceling will require you to restart the ${
    EXPORT_DELAY === HOURS_48 ? '2 days' : '1 minute'
  } waiting period.`
}

export const getConfirmCloseDelayText = (): string => {
  return `Closing the settings menu will require you to restart the ${
    EXPORT_DELAY === HOURS_48 ? '2 days' : '1 minute'
  } waiting period.`
}

import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useMemo
} from 'react'
import {
  AddFidoChallenge,
  CubeSignerResponse,
  Empty,
  TotpChallenge
} from '@cubist-labs/cubesigner-sdk'
import { useVerifyRecoveryMethods } from 'common/hooks/useVerifyRecoveryMethods'
import { useRouter } from 'expo-router'
import SeedlessService from 'seedless/services/SeedlessService'
import { showSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import { copyToClipboard } from 'common/utils/clipboard'
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNavigation } from '@react-navigation/native'
import { FidoType } from 'services/passkey/types'
import { useLogoModal } from 'common/hooks/useLogoModal'
import PasskeyService from 'services/passkey/PasskeyService'
import { dismissTotpStack } from '../utils/dismissTotpStack'

type MfaType = FidoType.PASS_KEY | FidoType.YUBI_KEY | 'Authenticator'

export interface SeedlessManageRecoveryMethodsState {
  verifiedTotpChallenge?: TotpChallenge
  setVerifiedTotpChallenge: (challenge: TotpChallenge) => void
  totpResetInit: () => Promise<void>
  totpKey?: string
  handleCopyCode: () => void
  onVerifyCode: <T>(code: string) => Promise<Result<T, TotpErrors>>
  fidoDelete: (fidoId: string) => Promise<void>
  onVerifySuccess: <T>(mfaChallenge: T) => void
  fidoRegisterInit: (name: string, fidoType: FidoType) => Promise<void>
  onVerifyFido: () => Promise<void>
}

export const SeedlessManageRecoveryMethodsContext =
  createContext<SeedlessManageRecoveryMethodsState>(
    {} as SeedlessManageRecoveryMethodsState
  )

export const SeedlessManageRecoveryMethodsProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const { showLogoModal, hideLogoModal } = useLogoModal()
  const { verifyFido, verifyMFA } = useVerifyRecoveryMethods(
    SeedlessService.session
  )
  const router = useRouter()
  const { getState } = useNavigation()

  const [mfaChallengeResponse, setMfaChallengeResponse] =
    useState<CubeSignerResponse<TotpChallenge | AddFidoChallenge | Empty>>()
  const [verifiedTotpChallenge, setVerifiedTotpChallenge] =
    useState<TotpChallenge>()
  const [verifyMfaType, setVerifyMfaType] = useState<MfaType>()

  const totpKey = useMemo(() => {
    if (verifiedTotpChallenge && verifiedTotpChallenge.url) {
      return (
        new URL(verifiedTotpChallenge.url).searchParams.get('secret') ??
        undefined
      )
    }
  }, [verifiedTotpChallenge])

  const handleCopyCode = useCallback((): void => {
    totpKey && copyToClipboard(totpKey, 'Code copied')
  }, [totpKey])

  const onVerifyCode = useCallback(
    async <T,>(code: string): Promise<Result<T, TotpErrors>> => {
      if (!mfaChallengeResponse)
        return {
          success: false,
          error: new TotpErrors({
            name: 'UnexpectedError',
            message: 'Missing totpChallengeResponse'
          })
        }

      const result = await SeedlessService.session.verifyApprovalCode(
        mfaChallengeResponse,
        code
      )
      if (result.success) {
        return {
          success: result.success,
          value: result.value.data() as T
        }
      }
      return {
        success: result.success,
        error: result.error
      }
    },
    [mfaChallengeResponse]
  )

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const totpResetInit = useCallback(async (): Promise<void> => {
    const totpResetInitResponse = await SeedlessService.session.totpResetInit()
    setMfaChallengeResponse(totpResetInitResponse)
    setVerifyMfaType('Authenticator')
    if (totpResetInitResponse.requiresMfa() === false) {
      setVerifiedTotpChallenge(totpResetInitResponse.data())
      router.navigate('/accountSettings/addRecoveryMethods/authenticatorSetup')
      return
    }

    const mfaMethods = await SeedlessService.session.userMfa()
    if (mfaMethods.length === 0) {
      Logger.error(`verifyMFA: No MFA methods available`)
      showSnackbar(`No MFA methods available`)
    } else if (mfaMethods.length === 1) {
      if (mfaMethods[0]) {
        if (mfaMethods[0].type === 'totp') {
          router.navigate(
            '/accountSettings/addRecoveryMethods/verifyMfa/verifyTotpCode'
          )
          return
        }
        if (mfaMethods[0].type === 'fido') {
          const mfaId = totpResetInitResponse.mfaId()

          if (!mfaId) {
            throw new Error('MFA ID is missing')
          }
          await verifyFido({
            mfaId,
            response: totpResetInitResponse,
            onVerifySuccess: () => {
              router.navigate(
                '/accountSettings/addRecoveryMethods/authenticatorSetup'
              )
            }
          })
          return
        }
      }
    } else {
      router.navigate(
        `/accountSettings/addRecoveryMethods/verifyMfa/selectMfaMethod`
      )
    }
  }, [router, verifyFido, setMfaChallengeResponse, setVerifiedTotpChallenge])

  const fidoDelete = useCallback(
    async (fidoId: string): Promise<void> => {
      const fidoDeleteResponse = await SeedlessService.session.deleteFido(
        fidoId
      )
      setMfaChallengeResponse(fidoDeleteResponse)
      setVerifyMfaType(FidoType.PASS_KEY)
      if (fidoDeleteResponse.requiresMfa()) {
        const handleVerifySuccess = (): void => {
          router.canGoBack() && router.back()
          showSnackbar('Passkey removed')
        }

        verifyMFA({
          response: fidoDeleteResponse,
          onVerifySuccess: handleVerifySuccess,
          excludeFidoMfaId: fidoId,
          verifyMfaPath: '/accountSettings/addRecoveryMethods/verifyMfa'
        })
      } else {
        throw new Error('fidoDelete requires MFA')
      }
    },
    [verifyMFA, router]
  )

  const handleInitializeFido = useCallback(
    async (challenge: AddFidoChallenge, fidoType: FidoType): Promise<void> => {
      router.canGoBack() && router.back()

      showLogoModal()

      try {
        const withSecurityKey = fidoType === FidoType.YUBI_KEY
        const credential = await PasskeyService.createCredential(
          challenge.options,
          withSecurityKey
        )
        await challenge.answer(credential)
        AnalyticsService.capture('SeedlessMfaAdded')
        showSnackbar('Passkey added')
      } catch (e) {
        Logger.error(`${fidoType} registration failed`, e)
        showSnackbar(`Unable to register ${fidoType}`)
      } finally {
        hideLogoModal()
      }
    },
    [hideLogoModal, router, showLogoModal]
  )

  const fidoRegisterInit = useCallback(
    async (name: string, fidoType: FidoType): Promise<void> => {
      try {
        const fidoRegisterInitResponse =
          await SeedlessService.session.fidoRegisterInit(name)
        setMfaChallengeResponse(fidoRegisterInitResponse)
        setVerifyMfaType(fidoType)
        if (fidoRegisterInitResponse.requiresMfa()) {
          verifyMFA({
            response: fidoRegisterInitResponse,
            onVerifySuccess: response => {
              AnalyticsService.capture('SeedlessMfaVerified', {
                type: fidoType
              })
              handleInitializeFido(response, fidoType)
            },
            verifyMfaPath: '/accountSettings/addRecoveryMethods/verifyMfa'
          })
        } else {
          const addFidoChallenge = fidoRegisterInitResponse.data()
          handleInitializeFido(addFidoChallenge, fidoType)
        }
      } catch (e) {
        Logger.error('fidoRegisterInit error', e)
        showSnackbar('Unable to register fido. Please try again.')
      }
    },
    [handleInitializeFido, verifyMFA]
  )

  const onVerifySuccess = useCallback(
    <T,>(mfaChallenge: T): void => {
      dismissTotpStack(router, getState())
      AnalyticsService.capture('SeedlessMfaVerified', {
        type: verifyMfaType ?? 'Unknown'
      })
      if (
        verifyMfaType === 'Authenticator' &&
        (mfaChallenge as TotpChallenge).url
      ) {
        setVerifiedTotpChallenge(mfaChallenge as TotpChallenge)
        router.navigate(
          '/accountSettings/addRecoveryMethods/authenticatorSetup'
        )
        return
      }
      if (
        (verifyMfaType === FidoType.PASS_KEY ||
          verifyMfaType === FidoType.YUBI_KEY) &&
        (mfaChallenge as AddFidoChallenge).challengeId
      ) {
        handleInitializeFido(mfaChallenge as AddFidoChallenge, verifyMfaType)
        return
      }
      showSnackbar('Passkey Changed')
    },
    [getState, handleInitializeFido, router, verifyMfaType]
  )

  const onVerifyFido = useCallback(async (): Promise<void> => {
    const mfaId = mfaChallengeResponse?.mfaId()
    if (mfaChallengeResponse === undefined || mfaId === undefined) {
      throw new Error('MFA ID is missing')
    }
    await verifyFido({
      mfaId,
      response: mfaChallengeResponse,
      onVerifySuccess
    })
  }, [mfaChallengeResponse, onVerifySuccess, verifyFido])

  return (
    <SeedlessManageRecoveryMethodsContext.Provider
      value={{
        verifiedTotpChallenge,
        setVerifiedTotpChallenge,
        totpResetInit,
        totpKey,
        handleCopyCode,
        onVerifyCode,
        fidoDelete,
        onVerifySuccess,
        fidoRegisterInit,
        onVerifyFido
      }}>
      {children}
    </SeedlessManageRecoveryMethodsContext.Provider>
  )
}

export function useSeedlessManageRecoveryMethodsContext(): SeedlessManageRecoveryMethodsState {
  return useContext(SeedlessManageRecoveryMethodsContext)
}

import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { dismissTotpStack } from 'features/accountSettings/utils/dismissTotpStack'
import { useNavigation } from '@react-navigation/native'
import SeedlessService from 'seedless/services/SeedlessService'
import { selectWalletState, WalletState } from 'store/app'
import { useDispatch, useSelector } from 'react-redux'
import { initWalletServiceAndUnlock } from 'hooks/useWallet'
import { SEEDLESS_MNEMONIC_STUB } from 'seedless/consts'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const { oidcToken, mfaId } = useLocalSearchParams<{
    oidcToken: string
    mfaId: string
  }>()
  const router = useRouter()
  const { getState } = useNavigation()
  const dispatch = useDispatch()
  const walletState = useSelector(selectWalletState)

  const handleVerifySuccess = useCallback(async (): Promise<void> => {
    if (walletState === WalletState.INACTIVE) {
      initWalletServiceAndUnlock({
        dispatch,
        mnemonic: SEEDLESS_MNEMONIC_STUB,
        walletType: WalletType.SEEDLESS,
        isLoggingIn: true
      }).catch(Logger.error)
    }
    dismissTotpStack(router, getState()) // dismiss the mfa screens
    router.canGoBack() && router.back() // dismiss the token expired screen
  }, [dispatch, getState, router, walletState])

  const handleVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      if (oidcToken && mfaId) {
        return SeedlessService.session.verifyCode(oidcToken, mfaId, code)
      }
      return {
        success: false,
        error: new TotpErrors({
          name: 'UnexpectedError',
          message: 'Missing oidcToken or mfaId'
        })
      }
    },
    [mfaId, oidcToken]
  )

  return (
    <VerifyCode
      onVerifyCode={handleVerifyCode}
      onVerifySuccess={handleVerifySuccess}
    />
  )
}

export default VerifyTotpCodeScreen

import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import React from 'react'
import { useCallback } from 'react'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useLocalSearchParams, useRouter } from 'expo-router'
import SeedlessService from 'seedless/services/SeedlessService'
import { useInitSeedlessWalletAndUnlock } from 'common/hooks/useInitSeedlessWalletAndUnlock'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { Loader } from 'common/components/Loader'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { initSeedlessWalletAndUnlock } = useInitSeedlessWalletAndUnlock()
  const { oidcToken, mfaId } = useLocalSearchParams<{
    oidcToken: string
    mfaId: string
  }>()
  const { navigate } = useRouter()
  const { canGoBack, back } = useRouter()
  const { data: mfaMethods, isLoading } = useUserMfa()

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/sessionExpired/verifyTotpCode',
          params: {
            mfaId,
            oidcToken
          }
        })
        return
      }

      if (recoveryMethod.mfa?.type === 'fido' && oidcToken && mfaId) {
        await SeedlessService.session.approveFido(oidcToken, mfaId, true)
        await initSeedlessWalletAndUnlock()
        canGoBack() && back() // dismiss selectMfaMethod screen
        canGoBack() && back() // dismiss sessionExpired screen
      }
    },
    [oidcToken, mfaId, navigate, canGoBack, back, initSeedlessWalletAndUnlock]
  )

  return isLoading ? (
    <Loader />
  ) : (
    <SelectRecoveryMethods
      mfaMethods={mfaMethods ?? []}
      onSelectMfa={type => handleSelectMfa(type)}
      sx={{ marginHorizontal: 16 }}
    />
  )
}

export default SelectMfaMethodScreen

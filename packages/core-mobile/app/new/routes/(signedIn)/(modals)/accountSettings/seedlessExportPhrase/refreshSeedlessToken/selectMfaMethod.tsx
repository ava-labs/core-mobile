import { useUserMfa } from 'common/hooks/useUserMfa'
import { useRouter } from 'expo-router'
import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import React, { useCallback } from 'react'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const { seedlessExportService, sessionData, checkPendingExports } =
    useSeedlessMnemonicExportContext()
  const { canGoBack, back } = useRouter()
  const { data: mfaMethods, isLoading } = useUserMfa()

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate(
          // @ts-ignore TODO: make routes typesafe
          '/accountSettings/seedlessExportPhrase/refreshSeedlessToken/verifyTotpCode'
        )
        return
      }

      if (recoveryMethod.mfa?.type === 'fido' && sessionData) {
        await seedlessExportService.session.approveFido(
          sessionData.oidcToken,
          sessionData.mfaId,
          true
        )
        canGoBack() && back()
        checkPendingExports()
      }
    },
    [
      sessionData,
      navigate,
      seedlessExportService.session,
      canGoBack,
      back,
      checkPendingExports
    ]
  )

  return (
    <SelectRecoveryMethods
      mfaMethods={mfaMethods ?? []}
      onSelectMfa={type => handleSelectMfa(type)}
      isLoading={isLoading}
    />
  )
}

export default SelectMfaMethodScreen

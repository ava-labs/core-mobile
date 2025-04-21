import { SelectRecoveryMethods } from 'features/accountSettings/components/SelectRecoveryMethods'
import React from 'react'
import { useCallback } from 'react'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { Loader } from 'common/components/Loader'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const SelectMfaMethodScreen = (): React.JSX.Element => {
  const { seedlessExportService, sessionData, checkPendingExports } =
    useSeedlessMnemonicExportContext()
  const { canGoBack, back, navigate } = useDebouncedRouter()
  const { data: mfaMethods, isLoading } = useUserMfa()

  const handleSelectMfa = useCallback(
    async (recoveryMethod: RecoveryMethod): Promise<void> => {
      if (recoveryMethod.mfa?.type === 'totp') {
        navigate('./verifyTotpCode')
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

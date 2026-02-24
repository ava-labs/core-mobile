import React from 'react'
import { useDispatch } from 'react-redux'
import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useWallet } from 'hooks/useWallet'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'
import { useDebouncedCallback } from 'use-debounce'
import { useRecoveryMethodContext } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { setIsNewSeedlessUser } from 'store/nestEgg'

export default function Confirmation(): JSX.Element {
  const dispatch = useDispatch()
  const { login } = useWallet()
  const { isNewSeedlessUser } = useRecoveryMethodContext()

  const handleNext = (): void => {
    // Only set the Nest Egg flag after successful onboarding completion
    // This ensures only truly new users (not ALREADY_REGISTERED users without MFA)
    // are marked as eligible for the Nest Egg campaign
    if (isNewSeedlessUser) {
      dispatch(setIsNewSeedlessUser(true))
    }
    login(WalletType.SEEDLESS).catch(Logger.error)
  }

  const debouncedHandleNext = useDebouncedCallback(handleNext, 1000)

  return <Component onNext={debouncedHandleNext} />
}

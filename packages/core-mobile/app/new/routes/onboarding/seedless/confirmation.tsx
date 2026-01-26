import React from 'react'
import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useWallet } from 'hooks/useWallet'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'
import { useDebouncedCallback } from 'use-debounce'
import { useLocalSearchParams } from 'expo-router'
import { useDispatch } from 'react-redux'
import { setIsNewSeedlessUser } from 'store/nestEgg'

export default function Confirmation(): JSX.Element {
  const { login } = useWallet()
  const dispatch = useDispatch()
  const { recovering } = useLocalSearchParams<{ recovering: string }>()

  const handleNext = (): void => {
    // Set flag for new seedless users (not recovering existing wallet)
    const isNewUser = recovering !== 'true'
    if (isNewUser) {
      dispatch(setIsNewSeedlessUser(true))
    }

    login(WalletType.SEEDLESS).catch(Logger.error)
  }

  const debouncedHandleNext = useDebouncedCallback(handleNext, 1000)

  return <Component onNext={debouncedHandleNext} />
}

import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useWallet } from 'hooks/useWallet'
import React from 'react'
import { WalletType } from 'services/wallet/types'
import { useDebouncedCallback } from 'use-debounce'
import Logger from 'utils/Logger'

export default function Confirmation(): JSX.Element {
  const { login } = useWallet()

  const handleNext = (): void => {
    login(WalletType.MNEMONIC).catch(Logger.error)
  }

  const debouncedHandleNext = useDebouncedCallback(handleNext, 1000)

  return <Component onNext={debouncedHandleNext} />
}

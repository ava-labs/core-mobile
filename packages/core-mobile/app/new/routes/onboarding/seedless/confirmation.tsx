import React from 'react'
import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useWallet } from 'hooks/useWallet'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'

export default function Confirmation(): JSX.Element {
  const { login } = useWallet()

  const handleNext = (): void => {
    login(WalletType.SEEDLESS).catch(Logger.error)
  }
  return <Component onNext={handleNext} />
}

import { useLocalSearchParams } from 'expo-router'
import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useWallet } from 'hooks/useWallet'
import React from 'react'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'

export default function Confirmation(): JSX.Element {
  const { login } = useWallet()
  const { mnemonic } = useLocalSearchParams<{
    mnemonic: string
  }>()

  const handleNext = (): void => {
    mnemonic && login(mnemonic, WalletType.MNEMONIC).catch(Logger.error)
  }

  return <Component onNext={handleNext} />
}

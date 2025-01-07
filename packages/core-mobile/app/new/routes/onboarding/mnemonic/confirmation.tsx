import React from 'react'
import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useLocalSearchParams } from 'expo-router'
import { useWallet } from 'hooks/useWallet'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'

export default function Confirmation(): JSX.Element {
  const { login } = useWallet()
  const { mnemonic, selectedAvatarId } = useLocalSearchParams<{
    mnemonic: string
    selectedAvatarId: string
  }>()

  const handleNext = (): void => {
    mnemonic && login(mnemonic, WalletType.MNEMONIC).catch(Logger.error)
  }

  return <Component onNext={handleNext} selectedAvatarId={selectedAvatarId} />
}

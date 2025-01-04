import React from 'react'
import { Confirmation as Component } from 'features/onboarding/components/Confirmation'
import { useWallet } from 'hooks/useWallet'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'
import { SEEDLESS_MNEMONIC_STUB } from 'seedless/consts'
import { useLocalSearchParams } from 'expo-router'

export default function Confirmation(): JSX.Element {
  const { login } = useWallet()
  const { selectedAvatarId } = useLocalSearchParams<{
    selectedAvatarId: string
  }>()

  const handleNext = (): void => {
    login(SEEDLESS_MNEMONIC_STUB, WalletType.SEEDLESS).catch(Logger.error)
  }
  return <Component onNext={handleNext} selectedAvatarId={selectedAvatarId} />
}

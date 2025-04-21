import React, { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { SelectAvatar as Component } from 'features/onboarding/components/SelectAvatar'
import { AVATARS } from 'common/consts/avatars'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export default function SelectAvatar(): JSX.Element {
  const { navigate } = useDebouncedRouter()
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | undefined>(
    AVATARS[0]?.id
  )
  const { mnemonic } = useLocalSearchParams<{
    mnemonic: string
  }>()

  const handleNext = (): void => {
    navigate({
      pathname: './confirmation',
      params: { mnemonic, selectedAvatarId }
    })
  }

  return (
    <Component
      avatars={AVATARS}
      selectedAvatarId={selectedAvatarId}
      onNext={handleNext}
      setSelectedAvatarId={setSelectedAvatarId}
    />
  )
}

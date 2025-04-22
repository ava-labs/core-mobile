import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { SelectAvatar as Component } from 'features/onboarding/components/SelectAvatar'
import { AVATARS } from 'common/consts/avatars'

export default function SelectAvatar(): JSX.Element {
  const { navigate } = useRouter()
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | undefined>(
    AVATARS[0]?.id
  )
  const handleNext = (): void => {
    navigate({
      pathname: '/onboarding/seedless/confirmation',
      params: { selectedAvatarId }
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

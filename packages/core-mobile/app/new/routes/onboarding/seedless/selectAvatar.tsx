import { useAvatar } from 'common/hooks/useAvatar'
import { useRouter } from 'expo-router'
import { SelectAvatar as Component } from 'common/components/SelectAvatar'
import { useRandomAvatar } from 'features/onboarding/hooks/useRandomAvatar'
import { useRandomizedAvatars } from 'features/onboarding/hooks/useRandomizedAvatars'
import React, { useState } from 'react'

export default function SelectAvatar(): JSX.Element {
  const { navigate } = useRouter()
  const { saveLocalAvatar } = useAvatar()
  const randomizedAvatars = useRandomizedAvatars()
  const randomAvatar = useRandomAvatar(randomizedAvatars)

  const [selectedAvatar, setSelectedAvatar] = useState(randomAvatar)

  const handleNext = (): void => {
    if (selectedAvatar) {
      saveLocalAvatar(selectedAvatar.id)
    }

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/seedless/confirmation',
      params: { selectedAvatarId: selectedAvatar?.id }
    })
  }

  return (
    <Component
      avatars={randomizedAvatars}
      title={`Select your\npersonal avatar`}
      description="Add a display avatar for your wallet. You can change it at any time in the app's settings"
      selectedAvatar={selectedAvatar}
      onSubmit={handleNext}
      buttonText="Next"
      setSelectedAvatar={setSelectedAvatar}
    />
  )
}

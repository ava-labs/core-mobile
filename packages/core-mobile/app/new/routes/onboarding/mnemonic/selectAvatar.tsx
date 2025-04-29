import { SelectAvatar as Component } from 'common/components/SelectAvatar'
import { useAvatar } from 'common/hooks/useAvatar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRandomAvatar } from 'features/onboarding/hooks/useRandomAvatar'
import { useRandomizedAvatars } from 'features/onboarding/hooks/useRandomizedAvatars'
import React, { useState } from 'react'

export default function SelectAvatar(): JSX.Element {
  const { navigate } = useRouter()
  const { saveLocalAvatar } = useAvatar()

  const randomizedAvatars = useRandomizedAvatars()
  const randomAvatar = useRandomAvatar(randomizedAvatars)

  const [selectedAvatar, setSelectedAvatar] = useState(randomAvatar)

  const { mnemonic } = useLocalSearchParams<{
    mnemonic: string
  }>()

  const onSubmit = (): void => {
    if (selectedAvatar) {
      saveLocalAvatar(selectedAvatar.id)
    }

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/confirmation',
      params: { mnemonic, selectedAvatarId: selectedAvatar?.id }
    })
  }

  return (
    <Component
      avatars={randomizedAvatars}
      title={`Select your\npersonal avatar`}
      description="Add a display avatar for your wallet. You can change it at any time in the app's settings"
      selectedAvatar={selectedAvatar}
      onSubmit={onSubmit}
      buttonText="Next"
      setSelectedAvatar={setSelectedAvatar}
    />
  )
}

import { SelectAvatar as Component } from 'common/components/SelectAvatar'
import { useAvatar } from 'common/hooks/useAvatar'
import { useRouter } from 'expo-router'
import { useRandomAvatar } from 'features/onboarding/hooks/useRandomAvatar'
import { useRandomizedAvatars } from 'features/onboarding/hooks/useRandomizedAvatars'
import React, { useCallback, useState } from 'react'

export default function SelectAvatar(): JSX.Element {
  const { navigate } = useRouter()
  const { saveLocalAvatar } = useAvatar()

  const randomizedAvatars = useRandomizedAvatars()
  const randomAvatar = useRandomAvatar(randomizedAvatars)

  const [selectedAvatar, setSelectedAvatar] = useState(randomAvatar)

  const onSubmit = useCallback((): void => {
    if (selectedAvatar) {
      saveLocalAvatar(selectedAvatar.id)
    }

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/confirmation',
      params: { selectedAvatarId: selectedAvatar?.id }
    })
  }, [selectedAvatar, saveLocalAvatar, navigate])

  return (
    <Component
      avatars={randomizedAvatars}
      title={`Select your\npersonal avatar`}
      description="Add a display avatar for your wallet. You can change it at any time in the app's settings"
      selectedAvatar={selectedAvatar}
      initialAvatar={randomAvatar}
      onSubmit={onSubmit}
      buttonText="Next"
      setSelectedAvatar={setSelectedAvatar}
    />
  )
}

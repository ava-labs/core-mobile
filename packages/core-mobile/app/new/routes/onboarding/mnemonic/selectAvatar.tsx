import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useAvatar } from 'common/hooks/useAvatar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SelectAvatar as Component } from 'features/onboarding/components/SelectAvatar'
import React, { useMemo, useState } from 'react'
import { AVATARS } from 'store/settings/avatar'

export default function SelectAvatar(): JSX.Element {
  const { navigate } = useRouter()
  const { saveLocalAvatar } = useAvatar()

  const randomizedAvatars = useMemo(() => {
    return [...AVATARS].sort(() => Math.random() - 0.5)
  }, [])

  const [selectedAvatar, setSelectedAvatar] = useState(
    randomizedAvatars[Math.floor(Math.random() * randomizedAvatars.length)]
  )

  const { mnemonic } = useLocalSearchParams<{
    mnemonic: string
  }>()

  const onSubmit = (): void => {
    if (selectedAvatar) {
      saveLocalAvatar(selectedAvatar.id)
    }

    navigate({
      pathname: '/onboarding/mnemonic/confirmation',
      params: { mnemonic, selectedAvatarId: selectedAvatar?.id }
    })
  }

  return (
    <BlurredBarsContentLayout>
      <Component
        avatars={randomizedAvatars}
        description="Add a display avatar for your wallet. You can change it at any time in the app's settings"
        selectedAvatar={selectedAvatar}
        onSubmit={onSubmit}
        buttonText="Next"
        setSelectedAvatar={setSelectedAvatar}
      />
    </BlurredBarsContentLayout>
  )
}

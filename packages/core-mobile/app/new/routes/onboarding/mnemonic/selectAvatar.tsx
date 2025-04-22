import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SelectAvatar as Component } from 'features/onboarding/components/SelectAvatar'
import { AVATARS } from 'common/consts/avatars'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useAvatar } from 'common/hooks/useAvatar'
import { DEFAULT_AVATAR } from 'store/settings/avatar'

export default function SelectAvatar(): JSX.Element {
  const { navigate } = useRouter()
  const { saveLocalAvatar } = useAvatar()
  const [selectedAvatarId, setSelectedAvatarId] = useState(DEFAULT_AVATAR.id)

  const { mnemonic } = useLocalSearchParams<{
    mnemonic: string
  }>()

  const handleNext = (): void => {
    if (selectedAvatarId) saveLocalAvatar(selectedAvatarId)

    navigate({
      pathname: './confirmation',
      params: { mnemonic, selectedAvatarId }
    })
  }

  return (
    <BlurredBarsContentLayout>
      <Component
        avatars={AVATARS}
        description="Add a display avatar for your wallet. You can change it at any time in the app's settings"
        selectedAvatarId={selectedAvatarId}
        onNext={handleNext}
        setSelectedAvatarId={setSelectedAvatarId}
      />
    </BlurredBarsContentLayout>
  )
}

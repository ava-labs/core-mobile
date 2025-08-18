import { SelectAvatar } from 'common/components/SelectAvatar'
import { useAvatar } from 'common/hooks/useAvatar'
import { useRouter } from 'expo-router'
import { useRandomizedAvatars } from 'features/onboarding/hooks/useRandomizedAvatars'
import React, { useState } from 'react'

const SelectAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()
  const { saveLocalAvatar, avatar } = useAvatar()

  const randomizedAvatars = useRandomizedAvatars()

  const [selectedAvatar, setSelectedAvatar] = useState(avatar)

  const onSubmit = (): void => {
    back()
    if (selectedAvatar) {
      saveLocalAvatar(selectedAvatar.id)
    }
  }

  return (
    <SelectAvatar
      title={`Select your\npersonal avatar`}
      avatars={randomizedAvatars}
      initialAvatar={avatar}
      selectedAvatar={selectedAvatar}
      onSubmit={onSubmit}
      setSelectedAvatar={setSelectedAvatar}
      buttonText="Save"
      isModal
    />
  )
}

export default SelectAvatarScreen

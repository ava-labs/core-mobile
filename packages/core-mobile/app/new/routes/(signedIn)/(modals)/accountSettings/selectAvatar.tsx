import { useAvatar } from 'common/hooks/useAvatar'
import { useRouter } from 'expo-router'
import { SelectAvatar } from 'features/onboarding/components/SelectAvatar'
import React, { useMemo, useState } from 'react'
import { AVATARS } from 'store/settings/avatar'

const SelectAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()
  const { saveLocalAvatar, avatar } = useAvatar()

  const randomizedAvatars = useMemo(() => {
    return [...AVATARS].sort(() => Math.random() - 0.5)
  }, [])

  const [selectedAvatar, setSelectedAvatar] = useState(avatar)

  const onSubmit = (): void => {
    back()
    if (selectedAvatar) {
      saveLocalAvatar(selectedAvatar.id)
    }
  }

  return (
    <SelectAvatar
      avatars={randomizedAvatars}
      selectedAvatar={selectedAvatar}
      onSubmit={onSubmit}
      setSelectedAvatar={setSelectedAvatar}
      buttonText="Save"
    />
  )
}

export default SelectAvatarScreen

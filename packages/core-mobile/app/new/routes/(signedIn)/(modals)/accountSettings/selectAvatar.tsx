import { useAvatar } from 'common/hooks/useAvatar'
import { useRouter } from 'expo-router'
import { SelectAvatar } from 'features/onboarding/components/SelectAvatar'
import React, { useState } from 'react'
import { AVATARS } from 'store/settings/avatar'

const SelectAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()
  const { saveLocalAvatar, avatar } = useAvatar()

  const [selectedAvatar, setSelectedAvatar] = useState(avatar)

  const onSubmit = (): void => {
    back()
    saveLocalAvatar(selectedAvatar.id)
  }

  return (
    <SelectAvatar
      avatars={AVATARS}
      selectedAvatar={selectedAvatar}
      onSubmit={onSubmit}
      setSelectedAvatar={setSelectedAvatar}
      buttonText="Save"
    />
  )
}

export default SelectAvatarScreen

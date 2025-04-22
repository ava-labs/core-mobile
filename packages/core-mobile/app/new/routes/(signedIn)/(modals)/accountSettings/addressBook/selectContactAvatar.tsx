import { useRouter } from 'expo-router'
import { useNewContactAvatar } from 'features/accountSettings/store'
import { SelectAvatar } from 'features/onboarding/components/SelectAvatar'
import React, { useState } from 'react'
import { AVATARS } from 'store/settings/avatar'

const SelectContactAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()

  const [, setNewContactAvatar] = useNewContactAvatar()
  const [selectedAvatar, setSelectedAvatar] = useState(
    AVATARS[Math.floor(Math.random() * AVATARS.length)]
  )

  const onSubmit = (): void => {
    back()
    if (selectedAvatar) {
      setNewContactAvatar(selectedAvatar)
    }
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

export default SelectContactAvatarScreen

import { SelectAvatar } from 'common/components/SelectAvatar'
import { useRouter } from 'expo-router'
import { useNewContactAvatar } from 'features/accountSettings/store'
import { useRandomAvatar } from 'features/onboarding/hooks/useRandomAvatar'
import { useRandomizedAvatars } from 'features/onboarding/hooks/useRandomizedAvatars'
import React, { useRef, useState } from 'react'

const SelectContactAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()
  const [newContactAvatar, setNewContactAvatar] = useNewContactAvatar()

  const randomizedAvatars = useRandomizedAvatars()
  const randomAvatar = useRandomAvatar(randomizedAvatars)
  const initialAvatar = useRef(newContactAvatar ?? randomAvatar)

  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar.current)

  const onSubmit = (): void => {
    back()
    if (selectedAvatar) {
      setNewContactAvatar(selectedAvatar)
    }
  }

  return (
    <SelectAvatar
      title={'Select\ncontact avatar'}
      avatars={randomizedAvatars}
      initialAvatar={initialAvatar.current}
      selectedAvatar={selectedAvatar}
      onSubmit={onSubmit}
      setSelectedAvatar={setSelectedAvatar}
      isModal
      buttonText="Save"
    />
  )
}

export default SelectContactAvatarScreen

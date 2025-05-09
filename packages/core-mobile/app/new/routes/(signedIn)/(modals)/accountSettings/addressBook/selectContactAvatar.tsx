import { useRouter } from 'expo-router'
import { useNewContactAvatar } from 'features/accountSettings/store'
import { SelectAvatar } from 'common/components/SelectAvatar'
import { useRandomAvatar } from 'features/onboarding/hooks/useRandomAvatar'
import { useRandomizedAvatars } from 'features/onboarding/hooks/useRandomizedAvatars'
import React, { useState } from 'react'

const SelectContactAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()
  const [newContactAvatar, setNewContactAvatar] = useNewContactAvatar()

  const randomizedAvatars = useRandomizedAvatars()
  const randomAvatar = useRandomAvatar(randomizedAvatars)

  const [selectedAvatar, setSelectedAvatar] = useState(
    newContactAvatar ?? randomAvatar
  )

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
      selectedAvatar={selectedAvatar}
      onSubmit={onSubmit}
      setSelectedAvatar={setSelectedAvatar}
      buttonText="Save"
    />
  )
}

export default SelectContactAvatarScreen

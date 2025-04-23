import { useLocalSearchParams, useRouter } from 'expo-router'
import { useNewContactAvatar } from 'features/accountSettings/store'
import { SelectAvatar } from 'common/components/SelectAvatar'
import { useRandomAvatar } from 'features/onboarding/hooks/useRandomAvatar'
import { useRandomizedAvatars } from 'features/onboarding/hooks/useRandomizedAvatars'
import React, { useMemo, useState } from 'react'

const SelectContactAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()
  const [newContactAvatar, setNewContactAvatar] = useNewContactAvatar()
  const { name } = useLocalSearchParams<{ name: string }>()

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

  const title = useMemo(() => {
    if (name) {
      return `Select ${name}'s avatar`
    }
    return `Select contact\navatar`
  }, [name])

  return (
    <SelectAvatar
      title={title}
      avatars={randomizedAvatars}
      selectedAvatar={selectedAvatar}
      onSubmit={onSubmit}
      setSelectedAvatar={setSelectedAvatar}
      buttonText="Save"
    />
  )
}

export default SelectContactAvatarScreen

import { useLocalSearchParams, useRouter } from 'expo-router'
import { SelectAvatar } from 'features/onboarding/components/SelectAvatar'
import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { editContact, selectContact } from 'store/addressBook'
import { AVATARS } from 'store/settings/avatar'

const EditContactAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()
  const dispatch = useDispatch()
  const { contactId } = useLocalSearchParams<{ contactId: string }>()

  const contact = useSelector(selectContact(contactId))

  const randomizedAvatars = useMemo(() => {
    return [...AVATARS].sort(() => Math.random() - 0.5)
  }, [])

  const [selectedAvatar, setSelectedAvatar] = useState(
    contact?.avatar ??
      randomizedAvatars[Math.floor(Math.random() * AVATARS.length)]
  )

  const onSubmit = (): void => {
    if (!contact || !selectedAvatar) {
      return
    }
    back()
    dispatch(
      editContact({
        ...contact,
        avatar: selectedAvatar
      })
    )
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

export default EditContactAvatarScreen

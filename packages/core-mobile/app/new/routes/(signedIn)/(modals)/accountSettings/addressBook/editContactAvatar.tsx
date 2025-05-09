import { useLocalSearchParams, useRouter } from 'expo-router'
import { SelectAvatar } from 'common/components/SelectAvatar'
import { useRandomAvatar } from 'features/onboarding/hooks/useRandomAvatar'
import { useRandomizedAvatars } from 'features/onboarding/hooks/useRandomizedAvatars'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { editContact, selectContact } from 'store/addressBook'

const EditContactAvatarScreen = (): JSX.Element => {
  const { back } = useRouter()
  const dispatch = useDispatch()
  const { contactId } = useLocalSearchParams<{ contactId: string }>()

  const contact = useSelector(selectContact(contactId))

  const randomizedAvatars = useRandomizedAvatars()
  const randomAvatar = useRandomAvatar(randomizedAvatars)

  const [selectedAvatar, setSelectedAvatar] = useState(
    contact?.avatar ?? randomAvatar
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
      title={'Select\ncontact avatar'}
      avatars={randomizedAvatars}
      selectedAvatar={selectedAvatar}
      onSubmit={onSubmit}
      setSelectedAvatar={setSelectedAvatar}
      buttonText="Save"
    />
  )
}

export default EditContactAvatarScreen

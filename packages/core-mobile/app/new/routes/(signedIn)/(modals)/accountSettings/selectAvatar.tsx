import { View } from '@avalabs/k2-alpine'
import { AVATARS, DEFAULT_AVATAR } from 'store/settings/avatar'
import { useAvatar } from 'common/hooks/useAvatar'
import { SelectAvatar } from 'features/onboarding/components/SelectAvatar'
import React, { useState } from 'react'

const SelectAvatarScreen = (): JSX.Element => {
  const { saveLocalAvatar } = useAvatar()

  const [selectedAvatarId, setSelectedAvatarId] = useState(DEFAULT_AVATAR.id)

  const onSubmit = (): void => {
    saveLocalAvatar(selectedAvatarId)
  }

  return (
    <View
      sx={{
        flex: 1
      }}>
      <SelectAvatar
        avatars={AVATARS}
        selectedAvatarId={selectedAvatarId}
        onNext={onSubmit}
        setSelectedAvatarId={setSelectedAvatarId}
      />
    </View>
  )
}

export default SelectAvatarScreen

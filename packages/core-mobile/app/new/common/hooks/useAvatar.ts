import { useDispatch, useSelector } from 'react-redux'
import {
  AVATARS,
  AvatarType,
  selectSelectedAvatar,
  setSelectedAvatar
} from 'store/settings/avatar'

export const useAvatar = (): {
  avatar: AvatarType
  saveLocalAvatar: (avatarId: string) => Promise<void>
  saveExternalAvatar: (id: string, url: string) => Promise<void>
} => {
  const dispatch = useDispatch()
  const avatar = useSelector(selectSelectedAvatar)

  async function saveLocalAvatar(avatarId: string): Promise<void> {
    const foundAvatar = AVATARS.find(item => item.id === avatarId)
    if (foundAvatar) {
      dispatch(setSelectedAvatar(foundAvatar))
    }
  }

  async function saveExternalAvatar(id: string, url: string): Promise<void> {
    dispatch(setSelectedAvatar({ id, source: { uri: url } }))
  }

  return { avatar, saveLocalAvatar, saveExternalAvatar }
}

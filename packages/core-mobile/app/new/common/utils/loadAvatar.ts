import { AvatarType } from '@avalabs/k2-alpine'
import { AVATARS } from 'store/settings/avatar'

export function loadAvatar(avatar?: AvatarType): AvatarType | undefined {
  if (!avatar) {
    return undefined
  }

  return AVATARS.find(localAvatar => localAvatar.id === avatar.id) || avatar
}

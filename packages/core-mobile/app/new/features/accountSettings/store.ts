import { createZustandStore } from 'common/utils/createZustandStore'
import { AvatarType, DEFAULT_AVATAR } from 'store/settings/avatar'

export const useNewContactAvatar =
  createZustandStore<AvatarType>(DEFAULT_AVATAR)

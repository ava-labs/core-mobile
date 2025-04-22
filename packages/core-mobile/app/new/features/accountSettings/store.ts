import { createZustandStore } from 'common/utils/createZustandStore'
import { AvatarType, RANDOM_AVATAR } from 'store/settings/avatar'

export const useNewContactAvatar = createZustandStore<AvatarType>(RANDOM_AVATAR)

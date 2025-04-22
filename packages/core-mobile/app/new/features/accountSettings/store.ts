import { createZustandStore } from 'common/utils/createZustandStore'
import { AvatarType } from 'store/settings/avatar'

export const useNewContactAvatar = createZustandStore<AvatarType | undefined>(
  undefined
)

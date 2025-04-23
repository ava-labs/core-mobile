import { AvatarType } from '@avalabs/k2-alpine'
import { createZustandStore } from 'common/utils/createZustandStore'

export const useNewContactAvatar = createZustandStore<AvatarType | undefined>(
  undefined
)

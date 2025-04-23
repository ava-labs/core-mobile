import { useMemo } from 'react'
import { AVATARS } from 'store/settings/avatar'
import { AvatarType } from '@avalabs/k2-alpine'

export function useRandomizedAvatars(): AvatarType[] {
  return useMemo(() => [...AVATARS].sort(() => Math.random() - 0.5), [])
}

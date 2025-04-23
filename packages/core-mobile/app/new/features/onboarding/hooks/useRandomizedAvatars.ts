import { useMemo } from 'react'
import { AVATARS, AvatarType } from 'store/settings/avatar'

export function useRandomizedAvatars(): AvatarType[] {
  return useMemo(() => [...AVATARS].sort(() => Math.random() - 0.5), [])
}

import { AvatarType } from '@avalabs/k2-alpine'
import { useMemo } from 'react'

export function useRandomAvatar(avatars: AvatarType[]): AvatarType {
  return useMemo(
    () => avatars[Math.floor(Math.random() * avatars.length)] as AvatarType,
    [avatars]
  )
}

import { useMemo } from 'react'
import { AvatarType } from 'store/settings/avatar'

export function useRandomAvatar(avatars: AvatarType[]): AvatarType {
  return useMemo(
    () => avatars[Math.floor(Math.random() * avatars.length)] as AvatarType,
    [avatars]
  )
}

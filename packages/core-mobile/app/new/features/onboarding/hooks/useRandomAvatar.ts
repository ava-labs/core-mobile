import { AvatarType } from '@avalabs/k2-alpine'
import { useMemo } from 'react'
import { AVATARS } from 'store/settings/avatar'

export function useRandomAvatar(avatars: AvatarType[]): AvatarType | undefined {
  return useMemo(() => {
    // Ensure we have a valid avatars array with at least one avatar
    if (!avatars || avatars.length === 0) {
      // Return a fallback avatar from the default AVATARS
      return AVATARS[0]
    }
    return avatars[Math.floor(Math.random() * avatars.length)]
  }, [avatars])
}

import { useMemo } from 'react'
import UserService from 'services/user/UserService'

export const useUserUniqueID = (): string => {
  return useMemo(() => UserService.getUniqueID(), [])
}

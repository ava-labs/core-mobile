import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectAccounts } from 'store/account'

export const useCheckIfAccountExists = (): ((
  address: string | undefined
) => boolean) => {
  const accounts = useSelector(selectAccounts)

  return useCallback(
    (address: string | undefined): boolean => {
      return Object.values(accounts).some(
        ({ addressC }) => addressC.toLowerCase() === address?.toLowerCase()
      )
    },
    [accounts]
  )
}

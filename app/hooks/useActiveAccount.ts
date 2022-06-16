import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'

export function useActiveAccount() {
  return useSelector(selectActiveAccount)
}

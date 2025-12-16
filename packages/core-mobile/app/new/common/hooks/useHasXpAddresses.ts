import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'

export const useHasXpAddresses = (): boolean => {
  const activeAccount = useSelector(selectActiveAccount)
  return (
    !!activeAccount?.addressPVM &&
    activeAccount?.addressPVM.length > 0 &&
    !!activeAccount?.addressAVM &&
    activeAccount?.addressAVM.length > 0
  )
}

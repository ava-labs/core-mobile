import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { isLimitedMode } from 'utils/limitedMode'

export const useHasXpAddresses = (): boolean => {
  const activeAccount = useSelector(selectActiveAccount)
  if (isLimitedMode) return false
  return (
    !!activeAccount?.addressPVM &&
    activeAccount?.addressPVM.length > 0 &&
    !!activeAccount?.addressAVM &&
    activeAccount?.addressAVM.length > 0
  )
}

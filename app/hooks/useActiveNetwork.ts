import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

export function useActiveNetwork() {
  return useSelector(selectActiveNetwork)
}

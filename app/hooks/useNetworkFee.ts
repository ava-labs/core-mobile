import { useSelector } from 'react-redux'
import { getNetworkFee } from 'store/networkFee'

export function useNetworkFee() {
  return useSelector(getNetworkFee)
}

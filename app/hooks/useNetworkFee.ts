import { useSelector } from 'react-redux'
import { selectNetworkFee } from 'store/networkFee'

export function useNetworkFee() {
  return useSelector(selectNetworkFee)
}

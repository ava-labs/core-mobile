import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

export function useActiveNetwork() {
  const activeNetwork = useSelector(selectActiveNetwork)
  const isDeveloperMode = activeNetwork.isTestnet
  return { activeNetwork, isDeveloperMode }
}

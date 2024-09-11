import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetworks } from './networks/useNetworks'

export const useVariableSafeAreaInsets = (): {
  top: number
  bottom: number
  conditionalTop: number
} => {
  const { top, bottom } = useSafeAreaInsets()
  const {
    activeNetwork: { isTestnet }
  } = useNetworks()

  return {
    conditionalTop: isTestnet ? 0 : top,
    bottom,
    top
  }
}

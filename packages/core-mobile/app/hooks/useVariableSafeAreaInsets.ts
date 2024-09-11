import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useVariableSafeAreaInsets = (): {
  top: number
  bottom: number
  conditionalTop: number
} => {
  const { top, bottom } = useSafeAreaInsets()
  const isTestnet = useSelector(selectIsDeveloperMode)

  return {
    conditionalTop: isTestnet ? 0 : top,
    bottom,
    top
  }
}

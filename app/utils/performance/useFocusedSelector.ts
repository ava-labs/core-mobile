import { useIsFocused } from '@react-navigation/native'
import { shallowEqual, useSelector } from 'react-redux'
import { RootState } from 'store'

const returnTrueFn = () => true

/**
 * an enhanced useSelector that subscribes to/unsubscribes from store updates
 * whenever component is focused/unfocused
 */
export const useFocusedSelector = (selectorFn: (state: RootState) => any) => {
  const isFocused = useIsFocused()
  const equalityFn = isFocused ? shallowEqual : returnTrueFn
  return useSelector(selectorFn, equalityFn)
}

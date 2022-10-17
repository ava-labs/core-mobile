import { useIsFocused } from '@react-navigation/native'
import { Selector, shallowEqual, useSelector } from 'react-redux'
import { RootState } from 'store'

const returnTrueFn = () => true

/**
 * an enhanced useSelector that subscribes to/unsubscribes from store updates
 * whenever component is focused/unfocused
 */
export const useFocusedSelector = <Result>(
  selectorFn: Selector<RootState, Result>
) => {
  const isFocused = useIsFocused()
  const equalityFn = isFocused ? shallowEqual : returnTrueFn
  return useSelector(selectorFn, equalityFn)
}

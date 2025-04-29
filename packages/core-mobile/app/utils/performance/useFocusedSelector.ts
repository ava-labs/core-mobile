import { useIsFocused } from '@react-navigation/native'
import { Selector, shallowEqual, useSelector } from 'react-redux'
import { RootState } from 'store/types'

const returnTrueFn = (): boolean => true

/**
 * an enhanced useSelector that subscribes to/unsubscribes from store updates
 * whenever component is focused/unfocused
 */
export const useFocusedSelector = <Result>(
  selectorFn: Selector<RootState, Result>
): Result => {
  const isFocused = useIsFocused()
  const equalityFn = isFocused ? shallowEqual : returnTrueFn
  return useSelector(selectorFn, equalityFn)
}

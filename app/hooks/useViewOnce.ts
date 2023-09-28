import { useDispatch, useSelector } from 'react-redux'
import { ViewOnce, ViewOnceKey } from 'store/viewOnce/types'
import { selectViewOnce, setViewOnce } from 'store/viewOnce/slice'

/**
 * ViewOnce is used by views that needs to display something for the 1st time one.
 * After the user dismisses it, we persist the fact it has been shown once.
 *
 * The enum below can be used to add several items. Check is done simply by retrieving the
 * array and see if it includes the desired item, OR a convenience function:
 *
 * hasBeenViewed: (key: ViewOnceKey) => boolean;
 *
 * will return true/false by passing the emum you want to check.
 */

export const useViewOnce = (): ViewOnce => {
  const viewOnce = useSelector(selectViewOnce)
  const dispatch = useDispatch()

  const view = (key: ViewOnceKey): void => {
    dispatch(setViewOnce(key))
  }

  const hasBeenViewed = (key: ViewOnceKey): boolean => {
    return viewOnce[key] === true
  }

  return { view, hasBeenViewed }
}

import { useDispatch, useSelector } from 'react-redux'
import { ViewOnceKey } from 'store/viewOnce/types'
import { selectViewOnce, setViewOnce } from 'store/viewOnce/slice'

/**
 * ViewOnce is used by views that needs to display something for the 1st time one.
 * After the user dismisses it, we persist the fact it has been shown once.
 *
 * view: (key: ViewOnceKey) => void;
 * will set the enum you want to check as true.
 *
 * hasBeenViewed: (key: ViewOnceKey) => boolean;
 * will return true/false by passing the enum you want to check.
 */

type ViewOnce = {
  hasBeenViewed: (key: ViewOnceKey) => boolean
  view: (key: ViewOnceKey) => void
}

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

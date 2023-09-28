import { useDispatch, useSelector } from 'react-redux'
import {
  ViewOnceInformation,
  ViewOnceInformationKey
} from 'store/viewOnceInformation/types'
import {
  selectViewOnceInformation,
  setViewOnceInformation
} from 'store/viewOnceInformation/slice'

/**
 * ViewOnceInformation is used by views that needs to display something for the 1st time one.
 * After the user dismisses it, we persist the fact it has been shown once.
 *
 * The enum below can be used to add several items. Check is done simply by retrieving the
 * array and see if it includes the desired item, OR a convenience function:
 *
 * hasBeenViewed: (key: ViewOnceInformationKey) => boolean;
 *
 * will return true/false by passing the emum you want to check.
 */

export const useViewOnceInformation = (): ViewOnceInformation => {
  const viewOnceInfo = useSelector(selectViewOnceInformation)
  const dispatch = useDispatch()

  const view = (key: ViewOnceInformationKey): void => {
    dispatch(setViewOnceInformation(key))
  }

  const hasBeenViewed = (key: ViewOnceInformationKey): boolean => {
    return viewOnceInfo[key] === true
  }

  return { view, hasBeenViewed }
}

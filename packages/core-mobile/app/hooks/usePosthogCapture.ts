import { JsonMap } from 'store/posthog/types'

import { useDispatch } from 'react-redux'
import { capture as captureAction } from 'store/posthog'
import { useCallback } from 'react'

/**
 * @deprecated use useAnalytics instead
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const usePostCapture = () => {
  const dispatch = useDispatch()

  const capture = useCallback(
    (event: string, properties?: JsonMap) => {
      dispatch(captureAction({ event, properties }))
    },
    [dispatch]
  )

  return {
    capture
  }
}

import { JsonMap } from 'store/posthog/types'

import { useDispatch } from 'react-redux'
import { capture as captureAction } from 'store/posthog'
import { useCallback } from 'react'

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

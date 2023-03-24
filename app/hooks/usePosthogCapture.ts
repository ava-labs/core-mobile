import { JsonMap } from 'store/posthog/types'

import { useDispatch } from 'react-redux'
import { capture as captureAction } from 'store/posthog'

export const usePostCapture = () => {
  const dispatch = useDispatch()

  const capture = (event: string, properties?: JsonMap) => {
    dispatch(captureAction({ event, properties }))
  }

  return {
    capture
  }
}

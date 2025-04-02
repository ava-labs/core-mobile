import { useCallback, useEffect, useState } from 'react'
import { NativeMethods } from 'react-native'
import { Rect } from 'react-native-popover-view'

export const usePopoverAnchor = (
  sourceRef: React.RefObject<NativeMethods>
): {
  anchorRect: Rect | undefined
  isPopoverVisible: boolean
  onShowPopover: () => void
  onHidePopover: () => void
} => {
  const [isPopoverVisible, setIsPopoverVisible] = useState(false)
  const [anchorRect, setAnchorRect] = useState<Rect>()

  const showPopover = useCallback((): void => {
    if (sourceRef.current) {
      // eslint-disable-next-line max-params
      sourceRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        setAnchorRect(new Rect(pageX, pageY, width, height))
      })
    }
  }, [sourceRef])

  const hidePopover = useCallback((): void => {
    setAnchorRect(undefined)
  }, [])

  useEffect(() => {
    if (anchorRect) {
      setIsPopoverVisible(true)
    } else {
      setIsPopoverVisible(false)
    }
  }, [anchorRect])

  return {
    anchorRect,
    isPopoverVisible,
    onShowPopover: showPopover,
    onHidePopover: hidePopover
  }
}

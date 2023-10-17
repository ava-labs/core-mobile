import { ModalProps } from 'react-native'

export const ANIMATION_DURATION = 250
export const BORDER_RADIUS = 2
export const CARET_SIDE_SIZE = 10
export const POPOVER_WIDTH = 100

// On iOS, Modal orientations need to be manually specified
export const IOS_MODAL_SUPPORTED_ORIENTATIONS: ModalProps['supportedOrientations'] =
  [
    'portrait',
    'portrait-upside-down',
    'landscape',
    'landscape-left',
    'landscape-right'
  ]

export const DEFAULT_LAYOUT = {
  width: 0,
  height: 0,
  x: 0,
  y: 0
}

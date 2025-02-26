import { Dimensions } from 'react-native'
import { SEGMENT_CONTROL_HEIGHT } from './assets/consts'

export const portfolioTabContentHeight =
  Dimensions.get('window').height / 2 - SEGMENT_CONTROL_HEIGHT - 16

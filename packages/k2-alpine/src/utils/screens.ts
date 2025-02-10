import { Dimensions } from 'react-native'

const SCREEN_HEIGHT = Dimensions.get('window').height

export const isScreenSmall = SCREEN_HEIGHT <= 670

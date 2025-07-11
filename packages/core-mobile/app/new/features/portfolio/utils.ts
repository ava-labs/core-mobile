import { Dimensions } from 'react-native'

const width = Dimensions.get('window').width
const height = Dimensions.get('window').height

export const portfolioTabContentHeight = height / 2

const widthInches = width / 160
const heightInches = height / 160
const diagonalInches = Math.sqrt(widthInches ** 2 + heightInches ** 2)

export const isScreenLargerThan6_2Inches = diagonalInches > 6

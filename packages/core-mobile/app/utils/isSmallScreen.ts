import { Dimensions, PixelRatio } from 'react-native'

const { width, height } = Dimensions.get('window') // in dp
const dpi = PixelRatio.get() * 160 // 1 dp = 1/160 inch at mdpi (160 dpi)

// Calculate diagonal in dp
const diagonalDp = Math.sqrt(width * width + height * height)

// Convert diagonal from dp to inches
const diagonalInches = diagonalDp / (dpi / 160)

// Check if diagonal is 4 inches or less
export const isSmallScreen = diagonalInches <= 4

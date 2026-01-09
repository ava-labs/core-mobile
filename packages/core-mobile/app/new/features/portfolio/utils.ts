import { BasicViewOption, ViewOption } from 'common/types'
import { Dimensions } from 'react-native'

const width = Dimensions.get('window').width
const height = Dimensions.get('window').height

export const portfolioTabContentHeight = height / 2

const widthInches = width / 160
const heightInches = height / 160
const diagonalInches = Math.sqrt(widthInches ** 2 + heightInches ** 2)

export const isScreenLargerThan6_2Inches = diagonalInches > 6

export const getViewOptionToPersist = (
  selectedView: ViewOption,
  value: string
): ViewOption | undefined => {
  if (selectedView === ViewOption.List && value === BasicViewOption.Grid) {
    return ViewOption.LargeGrid as ViewOption
  } else if (
    selectedView !== ViewOption.List &&
    value === BasicViewOption.List
  ) {
    return ViewOption.List as ViewOption
  }
  return undefined
}

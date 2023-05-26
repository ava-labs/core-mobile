import React from 'react'
import Svg, { NumberProp, Path } from 'react-native-svg'
import { useApplicationContext } from 'contexts/ApplicationContext'

interface Props {
  selected: boolean
  size?: NumberProp
}

export default function CalendarSVG({ selected, size = 24 }: Props) {
  const { theme } = useApplicationContext()
  const svgColor = selected ? theme.alternateBackground : theme.colorIcon4

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 18 20"
      fill="none"
      testID={'calendarSVG'}>
      <Path
        d="M16 2H15V0H13V2H5V0H3V2H2C0.89 2 0.00999999 2.9 0.00999999 4L0 18C0 19.1 0.89 20 2 20H16C17.1 20 18 19.1 18 18V4C18 2.9 17.1 2 16 2ZM16 18H2V8H16V18ZM16 6H2V4H16V6ZM6 12H4V10H6V12ZM10 12H8V10H10V12ZM14 12H12V10H14V12ZM6 16H4V14H6V16ZM10 16H8V14H10V16ZM14 16H12V14H14V16Z"
        fill={svgColor}
      />
    </Svg>
  )
}

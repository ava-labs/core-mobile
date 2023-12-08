import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '@avalabs/k2-mobile'

interface Prop {
  selected?: boolean
  size?: number
}

function HomeSVG({ selected, size = 32 }: Prop): JSX.Element {
  const { theme } = useTheme()
  const svgColor = selected ? theme.colors.$blueDark : theme.colors.$neutral600

  return (
    <Svg width={size} height={size} viewBox="0 0 32 33" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25 13.6775L16.5 5.20593L7.99998 13.6775V27.5008H25V13.6775ZM28 16.6675L28.4411 17.1071C29.0279 17.6919 29.9776 17.6903 30.5624 17.1036C31.1472 16.5168 31.1456 15.5671 30.5589 14.9822L18.2648 2.72928C17.2891 1.75691 15.7108 1.75691 14.7352 2.72928L2.44109 14.9823C1.85432 15.5671 1.85273 16.5168 2.43754 17.1036C3.02234 17.6903 3.97209 17.6919 4.55885 17.1071L4.99998 16.6675V28.0008C4.99998 29.3815 6.11927 30.5008 7.49998 30.5008H25.5C26.8807 30.5008 28 29.3815 28 28.0008V16.6675Z"
        fill={svgColor}
      />
    </Svg>
  )
}

export default HomeSVG

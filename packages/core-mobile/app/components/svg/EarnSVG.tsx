import React from 'react'
import Svg, { NumberProp, Path } from 'react-native-svg'
import { useTheme } from '@avalabs/k2-mobile'

interface Props {
  selected: boolean
  size?: NumberProp
}

export default function EarnSVG({ selected, size = 24 }: Props): JSX.Element {
  const { theme } = useTheme()
  const svgColor = selected ? theme.colors.$blueDark : theme.colors.$neutral600

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 27 18"
      fill="none"
      testID={'earnSVG'}>
      <Path
        d="M3.08135 16.6859L10.148 9.6192L14.4814 13.9525C15.028 14.4992 15.908 14.4725 16.4147 13.8992L25.9747 3.1392C26.4414 2.6192 26.4147 1.8192 25.9214 1.31254C25.388 0.779205 24.4947 0.792538 23.988 1.36587L15.468 10.9392L11.0814 6.55254C10.5614 6.03254 9.72135 6.03254 9.20135 6.55254L1.08135 14.6859C0.561353 15.2059 0.561353 16.0459 1.08135 16.5659L1.20135 16.6859C1.72135 17.2059 2.57469 17.2059 3.08135 16.6859Z"
        fill={svgColor}
      />
    </Svg>
  )
}

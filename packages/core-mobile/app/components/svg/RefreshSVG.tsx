import React from 'react'
import { ColorValue } from 'react-native'
import Svg, { NumberProp, Path } from 'react-native-svg'

interface Props {
  color?: ColorValue
  width?: NumberProp
  height?: NumberProp
  testID?: string
}

export default function RefreshSVG({
  width = 24,
  height = 24,
  color = '#98989F'
}: Props): JSX.Element {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.6417 6.35292C16.0117 4.72292 13.7017 3.78292 11.1617 4.04292C7.49172 4.41292 4.47172 7.39292 4.06172 11.0629C3.51172 15.9129 7.26172 20.0029 11.9917 20.0029C15.1817 20.0029 17.9217 18.1329 19.2017 15.4429C19.5217 14.7729 19.0417 14.0029 18.3017 14.0029C17.9317 14.0029 17.5817 14.2029 17.4217 14.5329C16.2917 16.9629 13.5817 18.5029 10.6217 17.8429C8.40172 17.3529 6.61172 15.5429 6.14172 13.3229C5.30172 9.44292 8.25172 6.00292 11.9917 6.00292C13.6517 6.00292 15.1317 6.69292 16.2117 7.78292L14.7017 9.29292C14.0717 9.92292 14.5117 11.0029 15.4017 11.0029H18.9917C19.5417 11.0029 19.9917 10.5529 19.9917 10.0029V6.41292C19.9917 5.52292 18.9117 5.07292 18.2817 5.70292L17.6417 6.35292Z"
        fill={color}
      />
    </Svg>
  )
}

import React from 'react'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import { StyleProp, TextStyle } from 'react-native'

export const PopableLabel = ({
  label,
  textStyle,
  iconColor,
  icon
}: {
  label: string
  textStyle?: StyleProp<TextStyle>
  iconColor?: string
  icon?: React.ReactNode
}) => {
  return (
    <Row style={{ alignItems: 'center' }}>
      <AvaText.Body2 textStyle={textStyle}>{label}</AvaText.Body2>
      <Space x={4} />
      {icon ?? <InfoSVG color={iconColor} />}
    </Row>
  )
}

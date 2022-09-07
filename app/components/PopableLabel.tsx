import React from 'react'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import { StyleProp, TextStyle } from 'react-native'

export const PopableLabel = ({
  label,
  textStyle
}: {
  label: string
  textStyle?: StyleProp<TextStyle>
}) => {
  return (
    <Row style={{ alignItems: 'center' }}>
      <AvaText.Body2 textStyle={textStyle}>{label}</AvaText.Body2>
      <Space x={4} />
      <InfoSVG />
    </Row>
  )
}

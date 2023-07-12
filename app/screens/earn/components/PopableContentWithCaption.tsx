import React from 'react'
import AvaText from 'components/AvaText'
import { PopableContent } from 'components/PopableContent'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import { Popable } from 'react-native-popable'
import { useApplicationContext } from 'contexts/ApplicationContext'

export type IPopableContentWithCaption = {
  label: string
  message: string
  contentWidth?: number
}

export const PopableContentWithCaption = ({
  label,
  message,
  contentWidth = 110
}: IPopableContentWithCaption) => {
  const { theme } = useApplicationContext()

  return (
    <Popable
      content={<PopableContent message={message} />}
      position="right"
      style={{ width: contentWidth }}
      strictPosition={true}
      backgroundColor={theme.colorBg3}>
      <Row style={{ alignItems: 'center' }}>
        <AvaText.Caption textStyle={{ color: theme.neutral400 }}>
          {label}
        </AvaText.Caption>
        <Space x={4} />
        <InfoSVG size={12} />
      </Row>
    </Popable>
  )
}

import React from 'react'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Tooltip } from 'components/Tooltip'

export type IPopableContentWithCaption = {
  label: string
  message: string
  contentWidth?: number
}

export const PopableContentWithCaption = ({
  label,
  message,
  contentWidth = 110
}: IPopableContentWithCaption): JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <Tooltip
      content={message}
      position="right"
      style={{ width: contentWidth }}
      hitslop={{ left: 25, right: 5, top: 5, bottom: 5 }}
      isLabelPopable>
      <Row style={{ alignItems: 'center' }}>
        <AvaText.Caption textStyle={{ color: theme.neutral400 }}>
          {label}
        </AvaText.Caption>
        <Space x={4} />
        <InfoSVG size={12} />
      </Row>
    </Tooltip>
  )
}

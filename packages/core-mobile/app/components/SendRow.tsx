import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import React from 'react'
import { truncateAddress } from 'utils/Utils'

export default function SendRow({
  label,
  title,
  address
}: {
  label: string
  title: string
  address: string
  testID?: string
}) {
  return (
    <>
      <Space y={8} />
      <AvaText.Body2>{label}</AvaText.Body2>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Heading3>{title}</AvaText.Heading3>
        <AvaText.Body1>{truncateAddress(address)}</AvaText.Body1>
      </Row>
      <Space y={8} />
      <Separator />
    </>
  )
}

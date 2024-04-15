import React, { FC, useContext } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { TypedData } from 'store/rpc/handlers/eth_sign/schemas/ethSignTypedData'

interface Props {
  message: TypedData
}

function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const SignDataV4: FC<Props> = ({ message }) => {
  const theme = useContext(ApplicationContext).theme

  const { types, primaryType, ...rest } = message

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderRow = (rowData: Record<string, any>) => {
    return Object.keys(rowData).map((key, index) => {
      const data = rowData[key]

      if (isValidObject(data)) {
        return (
          <View
            key={index.toString()}
            style={{
              flex: 1,
              justifyContent: 'center',
              borderRadius: 8
            }}>
            <AvaText.Body2 color={theme.colorPrimary1}>
              {key.toUpperCase()}
            </AvaText.Body2>
            <Space y={8} />
            {renderRow(data)}
          </View>
        )
      }

      return (
        <Row
          key={index.toString()}
          style={{ alignItems: 'center', flexWrap: 'wrap', paddingBottom: 8 }}>
          <AvaText.Body2 color={theme.colorPrimary1}>{key}: </AvaText.Body2>
          <AvaText.Body2 color={'white'} textStyle={{ flexWrap: 'wrap' }}>
            {rowData[key]}
          </AvaText.Body2>
        </Row>
      )
    })
  }

  return (
    <View style={{ flex: 1 }}>
      <AvaText.Heading3>Message:</AvaText.Heading3>
      <Space y={8} />
      <ScrollView
        style={{
          maxHeight: 230,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 8
        }}>
        {renderRow(rest)}
      </ScrollView>
    </View>
  )
}

export default SignDataV4

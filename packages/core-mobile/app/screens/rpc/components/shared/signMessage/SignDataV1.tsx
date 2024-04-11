import React, { FC, useContext } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { OldTypedData } from 'store/rpc/handlers/eth_sign/schemas/ethSignTypedData'

interface Props {
  message: OldTypedData
}

const SignDataV1: FC<Props> = ({ message }) => {
  const theme = useContext(ApplicationContext).theme

  const renderMessage = (rowData: OldTypedData) => {
    return (
      <View
        style={{
          flex: 1
        }}>
        {rowData.map((item, index) => {
          return (
            <Row
              key={index.toString()}
              style={{
                alignItems: 'center',
                flexWrap: 'wrap',
                paddingBottom: 8
              }}>
              <AvaText.Body2 color={theme.colorPrimary1}>
                {item.name}:{' '}
              </AvaText.Body2>
              <AvaText.Body2 color={'white'} textStyle={{ flexWrap: 'wrap' }}>
                {item.value}
              </AvaText.Body2>
            </Row>
          )
        })}
      </View>
    )
  }

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <AvaText.Heading3>Message:</AvaText.Heading3>
      <Space y={8} />
      <ScrollView
        style={{
          maxHeight: 230,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 8
        }}>
        {renderMessage(message)}
      </ScrollView>
    </View>
  )
}

export default SignDataV1

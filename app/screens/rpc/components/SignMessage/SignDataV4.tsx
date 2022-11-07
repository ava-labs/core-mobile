import React, { FC, useContext } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { MessageAction } from 'services/walletconnect/types'
import { Row } from 'components/Row'

interface Props {
  action: MessageAction
}

const SignDataV4: FC<Props> = ({ action }) => {
  const theme = useContext(ApplicationContext).theme
  const data = action?.displayData
  const { types, primaryType, ...dataWithoutTypes } = data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderRow = (rowData: any) => {
    return Object.keys(rowData).map((key, index) => {
      if (typeof rowData[key] === 'object') {
        return (
          <View
            key={index}
            style={{
              flex: 1,
              justifyContent: 'center',
              borderRadius: 8
            }}>
            <AvaText.Body1 color={theme.colorPrimary1}>{key}</AvaText.Body1>
            {renderRow(rowData[key])}
          </View>
        )
      }

      return (
        <Row
          style={{ alignItems: 'center', flexWrap: 'wrap', paddingBottom: 8 }}>
          <AvaText.Body1 color={theme.colorPrimary1}>{key}: </AvaText.Body1>
          <AvaText.Body2 color={'white'} textStyle={{ flexWrap: 'wrap' }}>
            {rowData[key]}
          </AvaText.Body2>
        </Row>
      )
    })
  }

  return (
    <View style={{ flex: 1 }}>
      <Space y={16} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <Space y={8} />
      <ScrollView
        style={{
          maxHeight: 250,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 8
        }}>
        {renderRow(dataWithoutTypes)}
      </ScrollView>
    </View>
  )
}

export default SignDataV4

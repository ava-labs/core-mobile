import React, { FC, useContext } from 'react'
import { ScrollView, View } from 'react-native'
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

  const renderRow = (rowData: any) => {
    return Object.keys(rowData).map(key => {
      if (typeof rowData[key] === 'object') {
        return (
          <View
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
    <View>
      <Space y={16} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <Space y={8} />
      <View style={{ backgroundColor: theme.colorBg2, padding: 8 }}>
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
    </View>
  )
}

export default SignDataV4

import React, { FC, useContext } from 'react'
import { ScrollView, View } from 'react-native'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { MessageAction } from 'services/walletconnect/types'

interface Props {
  action: MessageAction
}

const SignData: FC<Props> = ({ action }) => {
  const theme = useContext(ApplicationContext).theme
  const data = action?.displayData.data
  return (
    <>
      <AvaText.Body2 color={theme.colorPrimary1}>
        Signing this message can be dangerous. This signature could potentially
        perform any operation on your account&apos;s behalf, including granting
        complete control of your account and all of its assets to the requesting
        site. Only sign this message if you know what you&apos;re doing or
        completely trust the requesting site
      </AvaText.Body2>
      <Space y={16} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <View style={{ backgroundColor: theme.colorBg1 }}>
        <ScrollView>
          {data?.map((x: any, i: number) => (
            <View key={i}>
              <AvaText.Body2>{x.name}: </AvaText.Body2>
              <AvaText.Body3>{x.value}</AvaText.Body3>
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  )
}

export default SignData

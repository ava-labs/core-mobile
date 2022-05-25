import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'

type Props = {
  errMsg: string
  onOk: () => void
}
export default function FailScreen({ errMsg, onOk }: Props): JSX.Element {
  const { theme } = useApplicationContext()

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <AvaText.Heading1
          textStyle={{
            textAlign: 'center',
            alignSelf: 'center'
          }}>
          Swap failed!
        </AvaText.Heading1>
        <Space y={10} />
        <AvaText.Body1
          color={theme.colorError}
          textStyle={{
            textAlign: 'center',
            alignSelf: 'center'
          }}>
          {errMsg}
        </AvaText.Body1>
        <Space y={100} />
        <AvaButton.PrimaryLarge style={{ margin: 18 }} onPress={onOk}>
          OK
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    bottom: 0,
    left: -10,
    right: 0,
    zIndex: 0,
    elevation: 0
  },
  container: { flex: 1, justifyContent: 'flex-end' }
})

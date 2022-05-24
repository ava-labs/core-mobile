import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'

type Props = {
  onOk: () => void
}
export default function DoneScreen({ onOk }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <AvaText.Heading1
          textStyle={{
            textAlign: 'center',
            alignSelf: 'center'
          }}>
          Swap{'\n'}successful!
        </AvaText.Heading1>
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

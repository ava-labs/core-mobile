import React from 'react'
import { StyleSheet, View } from 'react-native'
import WarningModal from 'components/WarningModal'

export type FeatureBlockedProps = {
  onOk: () => void
  message: string
}
export default function FeatureBlocked({
  onOk,
  message
}: FeatureBlockedProps): JSX.Element {
  return (
    <View style={[styles.background]}>
      <WarningModal onAction={onOk} title={'Attention'} message={message} />
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  }
})

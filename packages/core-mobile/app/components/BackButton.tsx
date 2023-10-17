import React from 'react'
import { StyleSheet } from 'react-native'
import { HeaderBackButton } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'

export const BackButton = ({ onPress }: { onPress?: () => void }) => {
  const { goBack } = useNavigation()

  return (
    <HeaderBackButton onPress={onPress || goBack} style={styles.container} />
  )
}

const styles = StyleSheet.create({
  container: { marginLeft: 8 }
})

import React from 'react'
import { HeaderBackButton } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'

export const BackButton = ({
  onPress
}: {
  onPress?: () => void
}): JSX.Element => {
  const { goBack } = useNavigation()

  return <HeaderBackButton onPress={onPress || goBack} testID="back_btn" />
}

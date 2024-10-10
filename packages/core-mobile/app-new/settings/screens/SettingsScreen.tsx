import React from 'react'
import { Text, View, TouchableOpacity } from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { SettingsStackProps } from 'navigation-new/types'

const SettingsScreen = (): JSX.Element => {
  const navigation = useNavigation<SettingsScreenProps['navigation']>()
  const handlePressAccountSetting = (): void => {
    navigation.navigate('SettingAccountScreen')
  }

  return (
    <View sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity onPress={handlePressAccountSetting}>
        <Text>Go to Account Setting</Text>
      </TouchableOpacity>
    </View>
  )
}

type SettingsScreenProps = SettingsStackProps<'SettingsScreen'>

export default SettingsScreen

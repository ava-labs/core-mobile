import useHomeScreenHeader from 'navigation-new/hooks/useHomeScreenHeader'
import React from 'react'
import { Text, TouchableOpacity, View } from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { PortfolioStackProps } from 'navigation-new/types'

const PortfolioHomeScreen = (): JSX.Element => {
  const navigation = useNavigation<PortfolioScreenProps['navigation']>()

  const handlePressPortfolioAssets = (): void => {
    navigation.navigate('PortfolioAssetsScreen')
  }

  useHomeScreenHeader()

  return (
    <View sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity onPress={handlePressPortfolioAssets}>
        <Text>Go to Portfolio Assets</Text>
      </TouchableOpacity>
    </View>
  )
}

type PortfolioScreenProps = PortfolioStackProps<'PortfolioHomeScreen'>

export default PortfolioHomeScreen

import useTabHomeHeader from 'navigation-new/hooks/useTabHomeHeader'
import React from 'react'
import { Text, TouchableOpacity, View } from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { PortfolioStackProps } from 'navigation-new/types'

const PortfolioScreen = (): JSX.Element => {
  const navigation = useNavigation<PortfolioScreenProps['navigation']>()

  const handlePressPortfolioAssets = (): void => {
    navigation.navigate('PortfolioAssetsScreen')
  }

  useTabHomeHeader()

  return (
    <View sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity onPress={handlePressPortfolioAssets}>
        <Text>Go to Portfolio Assets</Text>
      </TouchableOpacity>
    </View>
  )
}

type PortfolioScreenProps = PortfolioStackProps<'PortfolioScreen'>

export default PortfolioScreen

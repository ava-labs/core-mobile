import React from 'react'
import { View, ScrollView, Text } from '@avalabs/k2-alpine'
import {} from 'react-native-gesture-handler'

const PortfolioDefiScreen = (): JSX.Element => {
  return (
    <ScrollView
      sx={{
        flex: 1
      }}
      contentContainerSx={{
        paddingTop: 16,
        flex: 1,
        alignItems: 'center',
        gap: 16
      }}>
      <View>
        <Text variant="heading3">Defi</Text>
      </View>
    </ScrollView>
  )
}

export default PortfolioDefiScreen

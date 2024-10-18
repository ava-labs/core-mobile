import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import { Link } from 'expo-router'
import useHomeScreenHeader from '../../../../hooks/useHomeScreenHeader'

const PortfolioHomeScreen = (): JSX.Element => {
  useHomeScreenHeader()

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Text variant="heading3" sx={{ color: 'black' }}>
        Portfolio
      </Text>
      <Link href="/portfolio/assets">Go to Portfolio Assets</Link>
    </View>
  )
}

export default PortfolioHomeScreen

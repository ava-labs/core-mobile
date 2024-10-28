import React from 'react'
import { Text, ScrollView, View } from '@avalabs/k2-alpine'
import { Link } from 'expo-router'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'

const PortfolioHomeScreen = (): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <ScrollView
        contentContainerSx={{
          paddingTop: 16,
          paddingBottom: 16,
          alignItems: 'center',
          gap: 16
        }}>
        <View sx={{ height: 100, width: 200, backgroundColor: 'orange' }} />
        <Text variant="heading3">Portfolio</Text>
        <Link href="/portfolio/assets">
          <Text>Go to Portfolio Assets</Text>
        </Link>
        <View sx={{ height: 800, width: 200, backgroundColor: 'blue' }} />
        <View />
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default PortfolioHomeScreen

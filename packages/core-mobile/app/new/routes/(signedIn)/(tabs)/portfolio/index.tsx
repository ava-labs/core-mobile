import React from 'react'
import { Text, ScrollView, View, Button } from '@avalabs/k2-alpine'
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
          paddingHorizontal: 16,
          gap: 16
        }}>
        <View sx={{ height: 100, width: 200, backgroundColor: 'orange' }} />
        <Text variant="heading3">Portfolio</Text>
        <Link href="/portfolio/assets" asChild>
          <Button type="primary" size="medium">
            Go to Portfolio Assets
          </Button>
        </Link>
        <View sx={{ height: 800, width: 200, backgroundColor: 'orange' }} />
        <View />
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default PortfolioHomeScreen

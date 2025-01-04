import React from 'react'
import { Text, ScrollView } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'

const TrackHomeScreen = (): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <ScrollView
        contentContainerSx={{
          paddingTop: 16,
          flex: 1,
          alignItems: 'center',
          gap: 16
        }}>
        <Text variant="heading3">Track</Text>
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default TrackHomeScreen

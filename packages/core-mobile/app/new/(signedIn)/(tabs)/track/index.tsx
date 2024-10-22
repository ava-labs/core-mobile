import React from 'react'
import useHomeScreenHeader from 'hooks/useHomeScreenHeader'
import { Text, ScrollView } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import BlurredBarsContentLayout from 'components/navigation/BlurredBarsContentLayout'

const TrackHomeScreen = (): JSX.Element => {
  const headerHeight = useHeaderHeight()

  useHomeScreenHeader()

  return (
    <BlurredBarsContentLayout>
      <ScrollView
        contentContainerSx={{
          paddingTop: headerHeight + 16,
          flex: 1,
          alignItems: 'center',
          gap: 16
        }}>
        <Text variant="heading3" sx={{ color: 'black' }}>
          Track
        </Text>
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default TrackHomeScreen

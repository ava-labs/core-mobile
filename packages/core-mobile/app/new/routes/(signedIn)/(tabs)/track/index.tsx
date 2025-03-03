import React from 'react'
import { Text, ScrollView, Button } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useRouter } from 'expo-router'

const TrackHomeScreen = (): JSX.Element => {
  const { navigate } = useRouter()

  const handleTrack = (tokenId: string): void => {
    navigate({
      pathname: '/trackTokenDetail',
      params: { tokenId }
    })
  }

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
        <Button
          type="primary"
          size="small"
          onPress={() => handleTrack('avalanche-2')}>
          Avax
        </Button>
        <Button
          type="primary"
          size="small"
          onPress={() => handleTrack('bitcoin')}>
          Bitcoin
        </Button>
        <Button
          type="primary"
          size="small"
          onPress={() => handleTrack('ethereum')}>
          Ethereum
        </Button>
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default TrackHomeScreen

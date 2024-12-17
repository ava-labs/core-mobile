import React from 'react'
import { Button, Text, View } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'

const UnlockAirdrops = (): JSX.Element => {
  const handleOnPress = (): void => {
    // navigate('/recoveryPhrase')
  }

  return (
    <BlurredBarsContentLayout
      sx={{
        justifyContent: 'space-between',
        marginHorizontal: 16
      }}>
      <View sx={{ marginRight: 31 }}>
        <Text variant="heading2" sx={{ marginTop: 27, marginBottom: 10 }}>
          Unlock airdrops
        </Text>
        <Text variant="body1">
          As a Core user, you have the option to opt-in for{' '}
          <Text sx={{ fontWeight: '600' }}>airdrop rewards</Text> based on your
          activity and engagement. Core will collect anonymous interaction data
          to power this feature.
          {'\n'}
        </Text>
        <Text variant="body1">
          Core is committed to protecting your privacy. We will never sell or
          share your data. If you wish, you can disable this at any time in the
          settings menu.
        </Text>
      </View>
      <View sx={{ marginBottom: 36, marginTop: 20, gap: 16 }}>
        <Button type="primary" size="large" onPress={handleOnPress}>
          Unlock
        </Button>
        <Button type="tertiary" size="large" onPress={handleOnPress}>
          No thanks
        </Button>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default UnlockAirdrops

import { Text, View } from '@avalabs/k2-alpine'
// import ClockSVG from 'components/svg/ClockSVG'
import React from 'react'

export const NoHistory = (): JSX.Element => {
  return (
    <View sx={{ marginTop: 89, alignItems: 'center' }}>
      {/* <ClockSVG /> */}
      {/* <Space y={24} /> */}
      <Text
        variant="heading5"
        sx={{ color: '$neutral50', textAlign: 'center' }}>
        You have no History
      </Text>
      {/* <Space y={8} /> */}
      <Text variant="body2" sx={{ color: '$neutral400', textAlign: 'center' }}>
        Begin browsing to fill this space with pages that you have visited.
      </Text>
    </View>
  )
}

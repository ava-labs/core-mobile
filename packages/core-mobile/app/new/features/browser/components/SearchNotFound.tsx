import { Text, View } from '@avalabs/k2-alpine'
// import { Space } from 'components/Space'
// import ClockSVG from 'components/svg/ClockSVG'
import React from 'react'

export const SearchNotFound = (): JSX.Element => {
  return (
    <View
      sx={{ marginTop: 89, justifyContent: 'center', alignItems: 'center' }}>
      {/* <ClockSVG /> */}
      {/* <Space y={24} /> */}
      <Text
        variant="heading5"
        sx={{ color: '$neutral50', textAlign: 'center' }}>
        No Search Results
      </Text>
      {/* <Space y={8} /> */}
      <Text variant="body2" sx={{ color: '$neutral400', textAlign: 'center' }}>
        Try searching for something else.
      </Text>
    </View>
  )
}

import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import useCommonHeader from '../../../../hooks/useCommonHeader'

const PortfolioAssetsScreen = (): JSX.Element => {
  useCommonHeader()

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Text variant="heading3" sx={{ color: 'black' }}>
        Assets
      </Text>
    </View>
  )
}

export default PortfolioAssetsScreen

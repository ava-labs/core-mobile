import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'

export const CollectiblesScreen = (): JSX.Element => {
  return (
    <CollapsibleTabs.ScrollView showsVerticalScrollIndicator={false}>
      <View sx={{ alignItems: 'center', marginTop: 100 }}>
        <Text variant="heading3">Collectibles</Text>
      </View>
    </CollapsibleTabs.ScrollView>
  )
}

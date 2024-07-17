import { Text, View } from '@avalabs/k2-mobile'
import React from 'react'
import { AssetDiffs } from '@avalabs/vm-module-types'
import { sharedStyles } from './styles'
import { AssetDiffGroup } from './AssetDiffGroup'

const BalanceChange = ({
  assetDiffs
}: {
  assetDiffs: AssetDiffs
}): JSX.Element | null => {
  return (
    <>
      <Text variant="body2">Balance Change</Text>
      <View
        sx={{
          ...sharedStyles.info,
          backgroundColor: '$neutral800',
          gap: 10
        }}>
        <>
          {assetDiffs.outs.map((assetDiff, index) => (
            <AssetDiffGroup
              key={index.toString()}
              assetDiff={assetDiff}
              isOut={true}
            />
          ))}
          {assetDiffs.ins.map((assetDiff, index) => (
            <AssetDiffGroup
              key={index.toString()}
              assetDiff={assetDiff}
              isOut={false}
            />
          ))}
        </>
      </View>
    </>
  )
}

export default BalanceChange

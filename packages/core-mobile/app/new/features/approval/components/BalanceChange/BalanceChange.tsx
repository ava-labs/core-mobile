import { Separator, View } from '@avalabs/k2-alpine'
import React from 'react'
import { BalanceChange } from '@avalabs/vm-module-types'
import { TokenDiffGroup } from './TokenDiffGroup'

const BalanceChangeComponent = ({
  balanceChange
}: {
  balanceChange: BalanceChange
}): JSX.Element | null => {
  return (
    <View
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        marginBottom: 12
      }}>
      <View
        sx={{
          flexDirection: 'column'
        }}>
        {balanceChange.outs.map((outTokenDiff, index) => (
          <View key={index.toString()} sx={{ paddingVertical: 16 }}>
            <TokenDiffGroup tokenDiff={outTokenDiff} isOut={true} />
          </View>
        ))}
        {balanceChange.outs.length > 0 && balanceChange.ins.length > 0 && (
          <Separator sx={{ marginHorizontal: 16 }} />
        )}
        {balanceChange.ins.map((inTokenDiff, index) => (
          <View key={index.toString()} sx={{ paddingVertical: 16 }}>
            <TokenDiffGroup tokenDiff={inTokenDiff} isOut={false} />
          </View>
        ))}
      </View>
    </View>
  )
}

export default BalanceChangeComponent

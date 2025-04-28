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
        marginTop: 12,
        paddingVertical: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12
      }}>
      <View
        sx={{
          flexDirection: 'column'
        }}>
        {balanceChange.outs.map((outTokenDiff, index) => (
          <TokenDiffGroup
            key={index.toString()}
            tokenDiff={outTokenDiff}
            isOut={true}
          />
        ))}
        <Separator sx={{ marginVertical: 16, marginHorizontal: 16 }} />
        {balanceChange.ins.map((inTokenDiff, index) => (
          <TokenDiffGroup
            key={index.toString()}
            tokenDiff={inTokenDiff}
            isOut={false}
          />
        ))}
      </View>
    </View>
  )
}

export default BalanceChangeComponent

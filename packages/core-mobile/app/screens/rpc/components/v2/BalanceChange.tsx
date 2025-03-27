import { Text, View } from '@avalabs/k2-mobile'
import React from 'react'
import { BalanceChange } from '@avalabs/vm-module-types'
import { TokenDiffGroup } from './TokenDiffGroup'

const BalanceChangeComponent = ({
  balanceChange
}: {
  balanceChange: BalanceChange
}): JSX.Element | null => {
  return (
    <>
      <Text variant="buttonMedium" style={{ marginTop: 6 }}>
        Balance Change
      </Text>
      <View
        sx={{
          justifyContent: 'space-between',
          marginTop: 10,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          backgroundColor: '$neutral800',
          gap: 10
        }}>
        <>
          {balanceChange.outs.map((outTokenDiff, index) => (
            <TokenDiffGroup
              key={index.toString()}
              tokenDiff={outTokenDiff}
              isOut={true}
            />
          ))}
          {balanceChange.ins.map((inTokenDiff, index) => (
            <TokenDiffGroup
              key={index.toString()}
              tokenDiff={inTokenDiff}
              isOut={false}
            />
          ))}
        </>
      </View>
    </>
  )
}

export default BalanceChangeComponent

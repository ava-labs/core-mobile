import { TokenUnit } from '@avalabs/core-utils-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import { toNumber } from 'utils/string/toNumber'
import React from 'react'
import { Button, View, Text } from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { TokenLogo } from 'new/common/components/TokenLogo'

export const SpendLimits = ({
  spendLimits,
  onEdit
}: {
  spendLimits: SpendLimit[]
  onEdit?: () => void
}): JSX.Element | null => {
  return null
  // const data = useMemo(() => {
  //   return spendLimits.map(spendLimit => {
  //     return {
  //       title: spendLimit.tokenApproval.token.name
  //     }
  //   })
  // }, [spendLimits])
  // return <GroupList data={data} />
  const { formatCurrency } = useFormatCurrency()

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="buttonMedium">Spend Limit</Text>
        {onEdit ? (
          <Button size="small" type="tertiary" onPress={onEdit}>
            <Text>Edit</Text>
          </Button>
        ) : null}
      </View>
      <View
        sx={{
          backgroundColor: '$neutral800',
          marginTop: 8,
          marginBottom: 16,
          borderRadius: 10,
          padding: 16,
          gap: 16
        }}>
        {spendLimits.map((spendLimit, index) => {
          const token = spendLimit.tokenApproval.token
          let displayValue: string | undefined

          if (token.type === TokenType.ERC20) {
            let limitValueAmount = '0'
            if (spendLimit?.value?.bn) {
              limitValueAmount = new TokenUnit(
                spendLimit.value.bn,
                token.decimals,
                token.symbol
              ).toDisplay()
            }

            const isUnlimited = spendLimit.limitType === Limit.UNLIMITED

            displayValue = isUnlimited
              ? `${'Unlimited'} ${token.symbol}`
              : `${limitValueAmount} ${token.symbol}`
          }

          return (
            <View
              key={index.toString()}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <View style={{ alignItems: 'center', gap: 10 }}>
                {token.name && token.symbol && (
                  <TokenLogo
                    symbol={token.symbol}
                    logoUri={spendLimit.tokenApproval.logoUri}
                    size={32}
                  />
                )}
                <Text variant="body1">{token.name}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  marginLeft: 16,
                  flexShrink: 1
                }}>
                {displayValue !== undefined && (
                  <Text variant="body1">{displayValue}</Text>
                )}
                {spendLimit.tokenApproval.usdPrice !== undefined &&
                  spendLimit.limitType === Limit.DEFAULT && (
                    <Text variant="body2">
                      {formatCurrency({
                        amount: toNumber(spendLimit.tokenApproval.usdPrice)
                      })}
                    </Text>
                  )}
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

import { Text, View } from '@avalabs/k2-mobile'
import { balanceToDisplayValue } from '@avalabs/utils-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import AvaButton from 'components/AvaButton'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import React from 'react'

export const SpendLimits = ({
  spendLimits,
  onEdit
}: {
  spendLimits: SpendLimit[]
  onEdit?: () => void
}): JSX.Element | null => {
  const { currencyFormatter } = useApplicationContext().appHook

  return (
    <>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="buttonMedium">Spend Limit</Text>
        {onEdit ? (
          <AvaButton.Base onPress={onEdit}>
            <AvaText.TextLink>Edit</AvaText.TextLink>
          </AvaButton.Base>
        ) : null}
      </Row>
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
          const token = spendLimit.exposure.token
          let displayValue: string | undefined

          if (token.decimals && token.contractType === TokenType.ERC20) {
            let limitValueAmount = '0'
            if (spendLimit?.value?.bn) {
              limitValueAmount = balanceToDisplayValue(
                spendLimit.value?.bn,
                token.decimals
              )
            }

            const isUnlimited = spendLimit.limitType === Limit.UNLIMITED

            displayValue = isUnlimited
              ? `${'Unlimited'} ${token.symbol}`
              : `${limitValueAmount} ${token.symbol}`
          }

          return (
            <Row
              key={index.toString()}
              style={{
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <Row style={{ alignItems: 'center', gap: 10 }}>
                <Avatar.Token
                  name={token.name}
                  symbol={token.symbol}
                  logoUri={spendLimit.exposure.logoUri}
                  size={32}
                />
                <Text variant="body1">{token.name}</Text>
              </Row>
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
                {spendLimit.exposure.usdPrice !== undefined &&
                  spendLimit.limitType === Limit.DEFAULT && (
                    <Text variant="body2">
                      {currencyFormatter(spendLimit.exposure.usdPrice)}
                    </Text>
                  )}
              </View>
            </Row>
          )
        })}
      </View>
    </>
  )
}

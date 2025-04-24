import React, { useCallback, useMemo } from 'react'
import { formatUnits } from 'ethers'
import {
  View,
  Text,
  alpha,
  useTheme,
  Tooltip,
  Separator,
  Pressable
} from '@avalabs/k2-alpine'
import { GasAndFees } from 'utils/Utils'
import { HORIZONTAL_MARGIN } from 'new/common/consts'
import { FeeType } from '../../types'

export const CustomFees = ({
  customFees,
  feeDecimals,
  onPress
}: {
  customFees: GasAndFees | undefined
  feeDecimals: number | undefined
  onPress: ({
    key,
    title,
    value
  }: {
    key: FeeType
    title: string
    value: string
  }) => void
}): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()

  const isBaseUnitRate = feeDecimals === undefined

  const valueColor = useMemo(
    () => alpha(colors.$textPrimary, 0.6),
    [colors.$textPrimary]
  )

  const renderCustomFeeItem = useCallback(
    ({
      key,
      title,
      value,
      tooltip
    }: {
      key: FeeType
      title: string
      value: string
      tooltip:
        | {
            title: string
            description: string
          }
        | undefined
    }): JSX.Element => {
      return (
        <View sx={{ marginHorizontal: HORIZONTAL_MARGIN }}>
          <Separator />
          <View
            sx={{
              paddingVertical: 18,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                variant="body1"
                sx={{
                  color: '$textPrimary',
                  marginRight: 6
                }}>
                {title}
              </Text>
              {tooltip && (
                <Tooltip
                  title={tooltip.title}
                  description={tooltip.description}
                />
              )}
            </View>
            <Pressable
              hitSlop={10}
              onPress={() => {
                onPress({ key, title, value })
              }}>
              <Text
                variant="body1"
                testID="token_amount"
                sx={{
                  color: valueColor,
                  fontSize: 16,
                  lineHeight: 16
                }}>
                {value}
              </Text>
            </Pressable>
          </View>
        </View>
      )
    },
    [valueColor, onPress]
  )

  if (!customFees) return null

  const shouldRenderMaxPriorityFee = !isBaseUnitRate
  const shouldRenderGasLimit = !isBaseUnitRate

  return (
    <>
      {renderCustomFeeItem({
        key: FeeType.MAX_FEE_PER_GAS,
        title: isBaseUnitRate ? 'Network Fee' : 'Max base fee',
        value: isBaseUnitRate
          ? customFees.maxFeePerGas.toString()
          : formatUnits(customFees.maxFeePerGas.toString(), feeDecimals),
        tooltip: isBaseUnitRate
          ? undefined
          : {
              title: 'Network Fee',
              description:
                'The base fee is set by the network and changes frequently. Any difference between the set base fee and the actual base fee will be refunded.'
            }
      })}
      {shouldRenderMaxPriorityFee &&
        renderCustomFeeItem({
          key: FeeType.MAX_PRIORITY_FEE,
          title: 'Max priority fee',
          value: formatUnits(
            customFees.maxPriorityFeePerGas.toString(),
            feeDecimals
          ),
          tooltip: {
            title: 'Max priority fee',
            description:
              'The Priority Fee is an incentive paid to network operators to prioritize processing a transaction.'
          }
        })}
      {shouldRenderGasLimit &&
        renderCustomFeeItem({
          key: FeeType.GAS_LIMIT,
          title: 'Gas limit',
          value: String(customFees.gasLimit),
          tooltip: {
            title: 'Gas limit',
            description:
              'Total units of gas needed to complete the transaction. Do not edit unless necessary.'
          }
        })}
    </>
  )
}

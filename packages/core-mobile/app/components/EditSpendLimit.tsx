import { Space } from 'components/Space'
import React, { useState } from 'react'
import FlexSpacer from 'components/FlexSpacer'
import { Row } from 'components/Row'
import { Checkbox } from 'components/Checkbox'
import { BNInput } from 'components/BNInput'
import { useRoute } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import { View, Text, Button } from '@avalabs/k2-mobile'
import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import { hexToBN } from '@avalabs/core-utils-sdk'

const EditSpendLimit = (): JSX.Element | null => {
  const { spendLimit, onClose, updateSpendLimit, dAppName, editingToken } =
    useRoute<EditSpendLimitScreenProps['route']>().params
  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    ...spendLimit
  })

  const handleOnSave = (): void => {
    updateSpendLimit(customSpendLimit)
    onClose()
  }

  return (
    <RpcRequestBottomSheet onClose={onClose}>
      <View
        style={{
          flex: 1,
          paddingBottom: 16,
          paddingHorizontal: 16
        }}>
        <Text variant="heading3">Edit Spend Limit</Text>
        <Space y={24} />
        <Text variant="body2">Spending Limit</Text>
        <Space y={8} />
        <Text variant="body2" sx={{ color: '$neutral400' }}>
          Set a limit that you will allow {dAppName} to withdraw and spend.
        </Text>
        <Space y={26} />
        <Row style={{ alignItems: 'center' }}>
          <Checkbox
            selected={customSpendLimit.limitType === Limit.UNLIMITED}
            onPress={() => {
              setCustomSpendLimit({
                ...customSpendLimit,
                limitType: Limit.UNLIMITED
              })
            }}
          />
          <Space x={18} />
          <Text variant="buttonLarge">Unlimited</Text>
        </Row>
        <Space y={8} />
        <Row style={{ alignItems: 'flex-start' }}>
          <Checkbox
            selected={customSpendLimit.limitType === Limit.DEFAULT}
            onPress={() => {
              setCustomSpendLimit({
                ...customSpendLimit,
                limitType: Limit.DEFAULT
              })
            }}
          />
          <Space x={18} />
          <View>
            <Text variant="buttonLarge" sx={{ marginTop: 14 }}>
              Default
            </Text>
            <BNInput
              value={hexToBN(editingToken.defaultValue)}
              denomination={editingToken.decimals}
              editable={false}
              selectTextOnFocus={false}
              style={{ maxWidth: 300 }}
            />
          </View>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'flex-start' }}>
          <Checkbox
            selected={customSpendLimit.limitType === Limit.CUSTOM}
            onPress={() => {
              setCustomSpendLimit({
                ...customSpendLimit,
                limitType: Limit.CUSTOM
              })
            }}
          />
          <View sx={{ alignItems: 'flex-start', paddingTop: 13 }}>
            <Text variant="buttonLarge" sx={{ paddingStart: 16 }}>
              Custom Spend Limit
            </Text>
            <BNInput
              value={customSpendLimit?.value?.bn}
              placeholder={'Custom Limit'}
              onChange={value => {
                setCustomSpendLimit({
                  ...customSpendLimit,
                  value,
                  limitType: Limit.CUSTOM
                })
              }}
              denomination={editingToken.decimals}
            />
          </View>
        </Row>
        <FlexSpacer />
        <Button
          type="primary"
          size="xlarge"
          style={{ marginHorizontal: 12 }}
          onPress={handleOnSave}>
          Save
        </Button>
      </View>
    </RpcRequestBottomSheet>
  )
}

type EditSpendLimitScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.EditSpendLimit
>

export default EditSpendLimit

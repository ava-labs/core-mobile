import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import React, { useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import FlexSpacer from 'components/FlexSpacer'
import { Row } from 'components/Row'
import { Checkbox } from 'components/Checkbox'
import { BNInput } from 'components/BNInput'
import { useRoute } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import { View } from '@avalabs/k2-mobile'
import { Limit, SpendLimit } from 'hooks/useSpendLimits'
import { hexToBN } from '@avalabs/utils-sdk'

const EditSpendLimit = (): JSX.Element => {
  const { spendLimit, onClose, updateSpendLimit, dAppName } =
    useRoute<EditSpendLimitScreenProps['route']>().params
  const { theme } = useApplicationContext()
  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    ...spendLimit
  })

  const handleOnSave = (): void => {
    updateSpendLimit(customSpendLimit)
    onClose()
  }

  if (
    spendLimit.exposure.value === undefined ||
    spendLimit.exposure.token.decimals === undefined
  ) {
    throw new Error('exposure value for Spend Limit is undefined')
  }

  return (
    <RpcRequestBottomSheet onClose={onClose}>
      <View
        style={{
          flex: 1,
          paddingBottom: 16,
          paddingHorizontal: 16
        }}>
        <AvaText.LargeTitleBold>Edit Spend Limit</AvaText.LargeTitleBold>
        <Space y={24} />
        <AvaText.Body2 color={theme.colorText1}>Spending Limit</AvaText.Body2>
        <Space y={8} />
        <AvaText.Body2 color={theme.colorText2}>
          Set a limit that you will allow {dAppName} to withdraw and spend.
        </AvaText.Body2>
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
          <AvaText.Heading2>Unlimited</AvaText.Heading2>
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
            <AvaText.Heading2 textStyle={{ marginTop: 14 }}>
              Default
            </AvaText.Heading2>

            <BNInput
              value={hexToBN(spendLimit.exposure.value)}
              denomination={spendLimit.exposure.token.decimals}
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
          <View style={{ alignItems: 'flex-start', paddingTop: 13 }}>
            <AvaText.Heading2 textStyle={{ paddingStart: 16 }}>
              Custom Spend Limit
            </AvaText.Heading2>
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
              denomination={spendLimit.exposure.token.decimals}
            />
          </View>
        </Row>
        <FlexSpacer />
        <AvaButton.PrimaryLarge
          style={{ marginHorizontal: 12 }}
          onPress={handleOnSave}>
          Save
        </AvaButton.PrimaryLarge>
      </View>
    </RpcRequestBottomSheet>
  )
}

type EditSpendLimitScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.EditSpendLimit
>

export default EditSpendLimit

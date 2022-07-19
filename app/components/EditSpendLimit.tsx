import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import AvaButton from 'components/AvaButton'
import React, { useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import FlexSpacer from 'components/FlexSpacer'
import { Row } from 'components/Row'
import { TokenWithBalanceERC20 } from 'store/balance'
import { PeerMetadata } from 'screens/rpc/util/types'
import { Checkbox } from 'components/Checkbox'
import { BNInput } from 'components/BNInput'

export enum Limit {
  DEFAULT = 'DEFAULT',
  UNLIMITED = 'UNLIMITED',
  CUSTOM = 'CUSTOM'
}

export interface SpendLimit {
  limitType: Limit
  value?: {
    bn: any
    amount: string
  }
  default?: any
}

interface Props {
  token: TokenWithBalanceERC20
  setSpendLimit(limitData: SpendLimit): void
  onClose(): void
  spendLimit: SpendLimit
  site?: PeerMetadata
}

const EditSpendLimit = ({
  spendLimit,
  token,
  onClose,
  setSpendLimit,
  site
}: Props) => {
  const { theme } = useApplicationContext()
  const [customSpendLimit, setCustomSpendLimit] = useState<SpendLimit>({
    ...spendLimit
  })

  const handleOnSave = () => {
    setSpendLimit(customSpendLimit)
    onClose()
  }

  return (
    <View style={{ flex: 1, paddingBottom: 16, paddingHorizontal: 16 }}>
      <AvaText.LargeTitleBold>Edit Spend Limit</AvaText.LargeTitleBold>
      <Space y={24} />
      <AvaText.Body2 color={theme.colorText1}>Spending Limit</AvaText.Body2>
      <Space y={8} />
      <AvaText.Body2 color={theme.colorText2}>
        Set a limit that you will allow {site?.name} to withdraw and spend.
      </AvaText.Body2>
      <Space y={26} />
      <AvaButton.Base
        onPress={() => {
          setCustomSpendLimit({
            ...customSpendLimit,
            limitType: Limit.UNLIMITED
          })
        }}>
        <Row style={{ alignItems: 'center' }}>
          <Checkbox selected={customSpendLimit.limitType === Limit.UNLIMITED} />
          <Space x={18} />
          <AvaText.Heading2>Unlimited</AvaText.Heading2>
        </Row>
      </AvaButton.Base>
      <AvaButton.Base
        style={{ alignItems: 'flex-start' }}
        onPress={() => {
          setCustomSpendLimit({
            ...customSpendLimit,
            limitType: Limit.DEFAULT
          })
        }}>
        <Row style={{ alignItems: 'center' }}>
          <Checkbox selected={customSpendLimit.limitType === Limit.DEFAULT} />
          <Space x={18} />
          <AvaText.Heading2>Default</AvaText.Heading2>
        </Row>
        <BNInput
          style={{ paddingStart: 46 }}
          value={customSpendLimit.value?.bn}
          placeholder={'Maximum Limit'}
          onChange={value => {
            setCustomSpendLimit({
              ...customSpendLimit,
              value,
              limitType: Limit.DEFAULT
            })
          }}
          denomination={token.decimals}
        />
      </AvaButton.Base>
      <AvaButton.Base
        style={{ alignItems: 'flex-start' }}
        onPress={() => {
          setCustomSpendLimit({
            ...customSpendLimit,
            limitType: Limit.CUSTOM
          })
        }}>
        <Row style={{ alignItems: 'center' }}>
          <Checkbox selected={customSpendLimit.limitType === Limit.CUSTOM} />
          <Space x={18} />
          <AvaText.Heading2>Custom Spend Limit</AvaText.Heading2>
        </Row>
        <BNInput
          style={{ paddingStart: 46 }}
          editable={false}
          value={customSpendLimit.default}
          placeholder={'Maximum Limit'}
          onChange={value => {
            setCustomSpendLimit({
              ...customSpendLimit,
              value,
              limitType: Limit.CUSTOM
            })
          }}
          denomination={token.decimals}
        />
      </AvaButton.Base>

      <FlexSpacer />
      <AvaButton.PrimaryLarge
        style={{ marginHorizontal: 12 }}
        onPress={handleOnSave}>
        Save
      </AvaButton.PrimaryLarge>
    </View>
  )
}
export default EditSpendLimit

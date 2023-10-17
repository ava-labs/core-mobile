import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import AvaButton from 'components/AvaButton'
import React, { useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import FlexSpacer from 'components/FlexSpacer'
import { Row } from 'components/Row'
import { TokenWithBalanceERC20 } from 'store/balance'
import { Checkbox } from 'components/Checkbox'
import { BNInput } from 'components/BNInput'
import BN from 'bn.js'
import { PeerMeta } from 'services/walletconnectv2/types'

export enum Limit {
  DEFAULT = 'DEFAULT',
  UNLIMITED = 'UNLIMITED',
  CUSTOM = 'CUSTOM'
}

export interface SpendLimit {
  limitType: Limit
  value?: {
    bn: BN
    amount: string
  }
}

interface Props {
  token: TokenWithBalanceERC20
  setSpendLimit(limitData: SpendLimit): void
  onClose(): void
  spendLimit: SpendLimit
  requestedApprovalLimit?: BN
  site: PeerMeta | null | undefined
}

const EditSpendLimit = ({
  spendLimit,
  token,
  onClose,
  setSpendLimit,
  site,
  requestedApprovalLimit
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
            value={requestedApprovalLimit}
            denomination={token.decimals}
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
            denomination={token.decimals}
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
  )
}
export default EditSpendLimit

import { ApproveTransactionData } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { View } from 'react-native'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import Avatar from 'components/Avatar'
import React, { Dispatch } from 'react'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'
import { Limit, SpendLimit } from 'components/EditSpendLimit'
import { selectSelectedCurrency } from 'store/settings/currency'
import { UNLIMITED_SPEND_LIMIT_LABEL } from 'screens/rpc/hooks/useExplainTransactionShared'
import { formatCurrency } from 'utils/FormatCurrency'
import { sharedStyles } from './styles'

export function ApproveTransaction({
  site,
  tokenToBeApproved,
  txParams,
  displaySpendLimit,
  defaultSpendAmount,
  gasPrice,
  gasLimit,
  onCustomFeeSet,
  selectedGasFee,
  setShowCustomSpendLimit,
  setShowTxData,
  customSpendLimit,
  ...rest
}: ApproveTransactionData & {
  setShowCustomSpendLimit?: Dispatch<boolean>
  customSpendLimit: SpendLimit
}) {
  const theme = useApplicationContext().theme
  const account = useSelector(selectAccountByAddress(rest.fromAddress))
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const limitValueAmount = customSpendLimit.value?.amount

  const hideEdit: boolean =
    limitValueAmount === '0' && !!setShowCustomSpendLimit

  const isUnlimited = customSpendLimit.limitType === Limit.UNLIMITED

  const tokenValue = isUnlimited
    ? `${UNLIMITED_SPEND_LIMIT_LABEL} ${tokenToBeApproved.symbol}`
    : `${limitValueAmount} ${tokenToBeApproved.symbol}`

  const fiatValue = isUnlimited
    ? `${UNLIMITED_SPEND_LIMIT_LABEL} ${selectedCurrency}`
    : formatCurrency({
        amount: Number(limitValueAmount),
        currency: selectedCurrency,
        boostSmallNumberPrecision: true
      })

  return (
    <>
      <View
        style={[
          sharedStyles.info,
          {
            backgroundColor: theme.colorBg3
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Account</AvaText.Body2>
          <AvaText.ButtonMedium color={theme.colorText1}>
            {account?.title}
          </AvaText.ButtonMedium>
        </Row>
        <Space y={8} />
        {rest.toAddress && (
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body2>Contract</AvaText.Body2>
            <TokenAddress address={rest.toAddress} />
          </Row>
        )}
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Website</AvaText.Body2>
          <AvaText.ButtonMedium color={theme.colorText1}>
            {site?.url}
          </AvaText.ButtonMedium>
        </Row>
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2>Spend Limit</AvaText.Body2>
        {hideEdit || (
          <AvaButton.Base
            onPress={() => {
              setShowCustomSpendLimit?.(true)
            }}>
            <AvaText.TextLink>Edit</AvaText.TextLink>
          </AvaButton.Base>
        )}
      </Row>
      <View
        style={[
          {
            backgroundColor: theme.colorBg3,
            marginTop: 8,
            marginBottom: 16,
            borderRadius: 10,
            padding: 16
          }
        ]}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Row style={{ alignItems: 'center' }}>
            {tokenToBeApproved && (
              <Avatar.Custom
                name={tokenToBeApproved.name}
                logoUri={tokenToBeApproved?.logoUri}
              />
            )}
            <Space x={10} />
            <AvaText.Body1>{tokenToBeApproved?.symbol}</AvaText.Body1>
          </Row>
          {customSpendLimit && (
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end'
              }}>
              <AvaText.Body1>{tokenValue}</AvaText.Body1>
              <AvaText.Body2>{fiatValue}</AvaText.Body2>
            </View>
          )}
        </Row>
      </View>
    </>
  )
}

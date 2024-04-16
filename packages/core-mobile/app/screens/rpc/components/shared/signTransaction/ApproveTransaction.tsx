import { ApproveTransactionData } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { View } from 'react-native'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import Avatar from 'components/Avatar'
import React, { Dispatch, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'
import { Limit, SpendLimit } from 'components/EditSpendLimit'
import { selectSelectedCurrency } from 'store/settings/currency'
import { UNLIMITED_SPEND_LIMIT_LABEL } from 'screens/rpc/hooks/useExplainTransactionShared'
import { balanceToDisplayValue, bnToBig } from '@avalabs/utils-sdk'
import { formatLargeCurrency } from 'utils/Utils'
import { sharedStyles } from './styles'

export function ApproveTransaction({
  site,
  tokenToBeApproved,
  txParams,
  displaySpendLimit,
  defaultSpendAmount,
  maxFeePerGas,
  maxPriorityFeePerGas,
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
}): JSX.Element {
  const { currencyFormatter } = useApplicationContext().appHook
  const account = useSelector(selectAccountByAddress(rest.fromAddress))
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const limitValueAmount = useMemo(() => {
    if (!customSpendLimit.value?.bn || !tokenToBeApproved?.decimals) {
      return '0'
    }
    return balanceToDisplayValue(
      customSpendLimit.value?.bn,
      tokenToBeApproved.decimals
    )
  }, [customSpendLimit.value?.bn, tokenToBeApproved.decimals])

  const limitValueAmountInCurrency = useMemo(() => {
    if (!customSpendLimit.value?.bn || !tokenToBeApproved?.decimals) {
      return ''
    }
    const bnNumber = bnToBig(
      customSpendLimit.value.bn,
      tokenToBeApproved.decimals
    ).toNumber()
    return formatLargeCurrency(
      currencyFormatter(bnNumber * tokenToBeApproved.priceInCurrency),
      4
    )
  }, [
    currencyFormatter,
    customSpendLimit.value?.bn,
    tokenToBeApproved?.decimals,
    tokenToBeApproved?.priceInCurrency
  ])

  const hideEdit: boolean =
    limitValueAmount === '0' && !!setShowCustomSpendLimit

  const isUnlimited = customSpendLimit.limitType === Limit.UNLIMITED

  const tokenValue = isUnlimited
    ? `${UNLIMITED_SPEND_LIMIT_LABEL} ${tokenToBeApproved.symbol}`
    : `${limitValueAmount} ${tokenToBeApproved.symbol}`

  const fiatValue = isUnlimited
    ? `${UNLIMITED_SPEND_LIMIT_LABEL} ${selectedCurrency}`
    : limitValueAmountInCurrency

  return (
    <ApproveTransactionView
      title={account?.title}
      toAddress={rest.toAddress}
      url={site?.url}
      editButton={
        hideEdit ? null : (
          <AvaButton.Base
            onPress={() => {
              setShowCustomSpendLimit?.(true)
            }}>
            <AvaText.TextLink>Edit</AvaText.TextLink>
          </AvaButton.Base>
        )
      }
      tokenName={tokenToBeApproved.name}
      tokenLogoUri={tokenToBeApproved.logoUri}
      tokenSymbol={tokenToBeApproved.symbol}
      tokenValue={tokenValue}
      fiatValue={fiatValue}
    />
  )
}

type ApproveTransactionViewProps = {
  title?: string
  toAddress?: string
  url?: string
  editButton: JSX.Element | null
  tokenName: string
  tokenLogoUri?: string
  tokenSymbol: string
  tokenValue: string
  fiatValue: string
}

export const ApproveTransactionView = ({
  title,
  toAddress,
  url,
  editButton,
  tokenName,
  tokenLogoUri,
  tokenSymbol,
  tokenValue,
  fiatValue
}: ApproveTransactionViewProps): JSX.Element => {
  const theme = useApplicationContext().theme

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
            {title}
          </AvaText.ButtonMedium>
        </Row>
        <Space y={8} />
        {toAddress && (
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body2>Contract</AvaText.Body2>
            <TokenAddress textType="ButtonMedium" address={toAddress} />
          </Row>
        )}
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Website</AvaText.Body2>
          <AvaText.ButtonMedium
            textStyle={{ flexShrink: 1, marginLeft: 16, marginTop: -3 }}
            color={theme.colorText1}>
            {url}
          </AvaText.ButtonMedium>
        </Row>
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2>Spend Limit</AvaText.Body2>
        {editButton}
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
            <Avatar.Custom name={tokenName} logoUri={tokenLogoUri} />
            <Space x={10} />
            <AvaText.Body1>{tokenSymbol}</AvaText.Body1>
          </Row>
          <View
            style={{
              flexDirection: 'column',
              alignItems: 'flex-end',
              marginLeft: 16,
              flexShrink: 1
            }}>
            <AvaText.Body1>{tokenValue}</AvaText.Body1>
            <AvaText.Body2>{fiatValue}</AvaText.Body2>
          </View>
        </Row>
      </View>
    </>
  )
}

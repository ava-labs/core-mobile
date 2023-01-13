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
import { truncateAddress } from 'utils/Utils'
import { txStyles } from 'screens/rpc/components/SignTransaction'

export function ApproveTransaction({
  site,
  tokenToBeApproved,
  txParams,
  displaySpendLimit,
  defaultSpendAmount,
  gasPrice,
  gasLimit,
  onCustomFeeSet,
  hash,
  selectedGasFee,
  setShowCustomSpendLimit,
  setShowTxData,
  ...rest
}: ApproveTransactionData & {
  setShowCustomSpendLimit?: Dispatch<boolean>
}) {
  const theme = useApplicationContext().theme
  const account = useSelector(selectAccountByAddress(rest.fromAddress))
  const hideEdit: boolean =
    displaySpendLimit === '0' && !!setShowCustomSpendLimit

  return (
    <>
      <View
        style={[
          txStyles.info,
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
          <AvaText.Body1>
            {displaySpendLimit?.length > 18
              ? truncateAddress(displaySpendLimit, 12)
              : displaySpendLimit}
          </AvaText.Body1>
        </Row>
      </View>
    </>
  )
}

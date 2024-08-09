import React from 'react'
import { View, Text, useTheme } from '@avalabs/k2-mobile'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { RpcRequest, TransactionDetails } from '@avalabs/vm-module-types'
import { humanize } from 'utils/string/humanize'
import TokenAddress from 'components/TokenAddress'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'

export const TransactionDetailsView = ({
  details,
  request,
  setShowData
}: {
  details: TransactionDetails
  request: RpcRequest
  setShowData: (value: boolean) => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const isInternalRequest = isInAppRequest(request)

  const detailsToDisplay = []

  // loop through the transaction details
  // if the value is a string, display it
  // if the value is an address, display it as a token address
  for (const [key, value] of Object.entries(details)) {
    if (
      key === 'data' || // skip data since we display it separately
      (key === 'website' && isInternalRequest) // skip website for internal requests
    )
      continue

    if (typeof value === 'string') {
      const isAddress = value.substring(0, 2) === '0x'

      detailsToDisplay.push(
        <Row style={{ justifyContent: 'space-between' }} key={key}>
          <Text variant="caption">{humanize(key)}</Text>
          {isAddress ? (
            <TokenAddress address={value} />
          ) : (
            <Text variant="buttonSmall">{value}</Text>
          )}
        </Row>
      )
    }
  }

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="buttonMedium">Transaction Details</Text>
        {details.data && (
          <AvaButton.Base onPress={() => setShowData(true)}>
            <Row>
              <CarrotSVG
                color={colors.$neutral50}
                direction={'left'}
                size={12}
              />
              <CarrotSVG color={colors.$neutral50} size={12} />
            </Row>
          </AvaButton.Base>
        )}
      </Row>
      <View
        sx={{
          justifyContent: 'space-between',
          marginTop: 16,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          backgroundColor: '$neutral800'
        }}>
        {detailsToDisplay}
      </View>
    </>
  )
}

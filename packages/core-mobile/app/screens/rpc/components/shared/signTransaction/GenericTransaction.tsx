import { TransactionDisplayValues } from 'screens/rpc/util/types'
import React from 'react'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'
import { Text, View } from '@avalabs/k2-mobile'
import { sharedStyles } from './styles'

export function GenericTransaction({
  description,
  fromAddress,
  toAddress,
  name,
  isContractInteraction
}: TransactionDisplayValues & { isContractInteraction: boolean }): JSX.Element {
  const account = useSelector(selectAccountByAddress(fromAddress))

  return (
    <View
      sx={{
        ...sharedStyles.info,
        backgroundColor: '$neutral800',
        gap: 8
      }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption">Account</Text>
        <Text variant="caption">{account?.name}</Text>
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption">
          {isContractInteraction || description?.args?.asset
            ? 'Contract'
            : 'To'}
        </Text>
        <TokenAddress address={description?.args?.asset ?? toAddress} />
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption">Type</Text>
        <Text variant="caption">{name}</Text>
      </Row>
    </View>
  )
}

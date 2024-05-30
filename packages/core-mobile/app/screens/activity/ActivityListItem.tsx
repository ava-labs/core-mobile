import React, { FC, useMemo } from 'react'
import { View, Dimensions } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import MovementIndicator from 'components/MovementIndicator'
import { truncateAddress } from 'utils/Utils'
import { Transaction } from 'store/transaction'
import LinkSVG from 'components/svg/LinkSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/glacier-sdk'
import { PrimaryNetworkMethodIcon } from './PrimaryNetworkMethodIcon'

const windowWidth = Dimensions.get('window').width

type Props = {
  tx: Transaction
  onPress?: () => void
}

const ActivityListItem: FC<Props> = ({ tx, onPress }) => {
  const { theme } = useApplicationContext()

  const title = useMemo(() => {
    if (tx.txType) {
      switch (tx.txType) {
        case PChainTransactionType.ADD_DELEGATOR_TX:
          return 'Add Delegator'
        case PChainTransactionType.ADD_SUBNET_VALIDATOR_TX:
          return 'Add Subnet Validator'
        case PChainTransactionType.ADD_PERMISSIONLESS_VALIDATOR_TX:
          return 'Add Permissionless Validator'
        case PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX:
          return 'Add Permissionless Delegator'
        case PChainTransactionType.ADD_VALIDATOR_TX:
          return 'Add Validator'
        case PChainTransactionType.ADVANCE_TIME_TX:
          return 'Advance Time'
        case PChainTransactionType.BASE_TX:
          return 'BaseTx'
        case PChainTransactionType.CREATE_CHAIN_TX:
          return 'Create Chain'
        case PChainTransactionType.CREATE_SUBNET_TX:
          return 'Create Subnet'
        case PChainTransactionType.EXPORT_TX:
          return 'Export'
        case PChainTransactionType.IMPORT_TX:
          return 'Import'
        case PChainTransactionType.REWARD_VALIDATOR_TX:
          return 'Reward Validator'
        case PChainTransactionType.REMOVE_SUBNET_VALIDATOR_TX:
          return 'Remove Subnet Validator'
        case PChainTransactionType.TRANSFER_SUBNET_OWNERSHIP_TX:
          return 'Transfer Subnet Ownership'
        case PChainTransactionType.TRANSFORM_SUBNET_TX:
          return 'Transform Subnet'
        case XChainTransactionType.CREATE_ASSET_TX:
          return 'Create Asset'
        case XChainTransactionType.OPERATION_TX:
          return 'Operation'
        default:
          return 'Unknown'
      }
    }

    return tx.isContractCall ? 'Contract Call' : tx.token?.name ?? ''
  }, [tx.txType, tx.isContractCall, tx.token?.name])

  const subtitle = (
    tx.isSender
      ? `To: ${truncateAddress(tx.to ?? '')}`
      : `From: ${truncateAddress(tx.from ?? '')}`
  ).toLowerCase()

  const leftComponent = useMemo(() => {
    if (tx.txType) {
      return <PrimaryNetworkMethodIcon methodName={tx.txType} />
    }
    return <MovementIndicator metric={tx.isSender ? -1 : 0} />
  }, [tx.isSender, tx.txType])

  const rightComponent = tx.isContractCall ? (
    <View>
      <Space y={4} />
      <LinkSVG color={theme.white} />
    </View>
  ) : (
    <AvaText.ActivityTotal
      ellipsizeMode={'tail'}
      numberOfLines={2}
      textStyle={{
        marginTop: 2,
        marginLeft: windowWidth * 0.1,
        maxWidth: windowWidth * 0.3,
        textAlign: 'right'
      }}>
      {tx.isSender ? '-' : '+'}
      {tx.amount} {tx.token?.symbol}
    </AvaText.ActivityTotal>
  )

  return (
    <AvaListItem.Base
      title={title}
      subtitle={subtitle}
      leftComponent={leftComponent}
      rightComponent={rightComponent}
      onPress={onPress}
      embedInCard
    />
  )
}

export default ActivityListItem

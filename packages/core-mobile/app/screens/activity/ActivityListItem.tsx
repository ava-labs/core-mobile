import React, { FC, useMemo } from 'react'
import { View, Dimensions } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import MovementIndicator from 'components/MovementIndicator'
import { truncateAddress } from 'utils/Utils'
import { ActivityTransactionType } from 'store/transaction'
import LinkSVG from 'components/svg/LinkSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import {
  PChainTransactionType,
  XChainTransactionType
} from '@avalabs/glacier-sdk'
import { TransactionType, Transaction } from '@avalabs/vm-module-types'
import { PrimaryNetworkMethodIcon } from './PrimaryNetworkMethodIcon'
import { renderNftIcon } from './renderNftIcon'

const windowWidth = Dimensions.get('window').width

type Props = {
  tx: Omit<Transaction, 'txType'> & { txType: ActivityTransactionType }
  onPress?: () => void
}

const ActivityListItem: FC<Props> = ({ tx, onPress }) => {
  const { theme } = useApplicationContext()

  const title = useMemo(() => {
    switch (tx.txType) {
      case TransactionType.BRIDGE:
        return 'Bridge'
      case TransactionType.SWAP:
        return 'Swap'
      case TransactionType.SEND:
        return 'Send'
      case TransactionType.RECEIVE:
        return 'Receive'
      case TransactionType.NFT_BUY:
        return 'NFT Buy'
      case TransactionType.TRANSFER:
        return 'Transfer'
      case TransactionType.NFT_SEND:
        return 'NFT Send'
      case TransactionType.NFT_RECEIVE:
        return 'NFT Receive'
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
        if (tx.isContractCall) {
          return 'Contract Call'
        }
        return tx.tokens[0]?.symbol
    }
  }, [tx.txType, tx.isContractCall, tx.tokens])

  const subtitle = (
    tx.isSender
      ? `To: ${truncateAddress(tx.to ?? '')}`
      : `From: ${truncateAddress(tx.from ?? '')}`
  ).toLowerCase()

  const leftComponent = useMemo(() => {
    if (tx.txType) {
      if (
        (tx.txType === TransactionType.NFT_BUY ||
          tx.txType === TransactionType.NFT_SEND ||
          tx.txType === TransactionType.NFT_RECEIVE) &&
        tx.tokens[0]?.imageUri
      ) {
        return renderNftIcon(tx.tokens[0]?.imageUri)
      }
      return (
        <PrimaryNetworkMethodIcon
          methodName={tx.txType}
          isContractCall={tx.isContractCall}
          isSender={tx.isSender}
        />
      )
    }
    return <MovementIndicator metric={tx.isSender ? -1 : 0} />
  }, [tx.isContractCall, tx.isSender, tx.tokens, tx.txType])

  const rightComponent = (
    <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
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
        {tx.tokens[0]?.amount} {tx.tokens[0]?.symbol}
      </AvaText.ActivityTotal>
      {'explorerLink' in tx && tx?.explorerLink && (
        <>
          <Space y={8} />
          <LinkSVG color={theme.white} />
        </>
      )}
    </View>
  )

  return (
    <AvaListItem.Base
      testID="activityListItem"
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

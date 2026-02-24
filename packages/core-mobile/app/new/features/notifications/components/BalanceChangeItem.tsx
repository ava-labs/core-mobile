import React, { FC } from 'react'
import {
  AppNotification,
  isBalanceChangeNotification,
  BalanceChangeEventSchema
} from '../types'
import NotificationListItem from './NotificationListItem'
import NotificationIcon from './NotificationIcon'

type BalanceChangeItemProps = {
  notification: AppNotification
  showSeparator: boolean
  accessoryType: 'chevron' | 'none'
  testID?: string
}

const getTitle = (notification: AppNotification): string => {
  if (!isBalanceChangeNotification(notification)) return notification.title
  const { transfers, event } = notification.data ?? {}
  if (!transfers || transfers.length === 0) return notification.title

  const isSent =
    event === BalanceChangeEventSchema.enum.BALANCES_SPENT ||
    event === BalanceChangeEventSchema.enum.BALANCES_TRANSFERRED

  if (transfers.length === 1) {
    const { amount, tokenSymbol } = transfers[0]!
    if (event === BalanceChangeEventSchema.enum.ALLOWANCE_APPROVED) {
      if (amount === '0') {
        return `${tokenSymbol} revoked`
      }
      return `${amount} ${tokenSymbol} approved`
    }
    const action = isSent ? 'sent' : 'received'
    return `${amount} ${tokenSymbol} ${action}`
  }

  const tokenList = transfers
    .map(t => `${t.amount} ${t.tokenSymbol}`)
    .join(', ')
  const action = isSent ? 'sent' : 'received'
  return `${tokenList} ${action}`
}

const getSubtitle = (notification: AppNotification): string => {
  if (!isBalanceChangeNotification(notification)) return notification.body
  const { transfers, event } = notification.data ?? {}
  if (!transfers || transfers.length === 0) return notification.body

  const firstTransfer = transfers[0]!
  const { partnerAddress, amount, tokenSymbol } = firstTransfer

  if (event === BalanceChangeEventSchema.enum.ALLOWANCE_APPROVED) {
    if (amount === '0') {
      return `${tokenSymbol} allowance revoked`
    }
    return `${tokenSymbol} approved up to ${amount}`
  }

  if (!partnerAddress) return notification.body

  const isSent =
    event === BalanceChangeEventSchema.enum.BALANCES_SPENT ||
    event === BalanceChangeEventSchema.enum.BALANCES_TRANSFERRED
  const prefix = isSent ? 'to' : 'from'
  return `${prefix} ${partnerAddress}`
}

const BalanceChangeItem: FC<BalanceChangeItemProps> = ({
  notification,
  showSeparator,
  accessoryType,
  testID
}) => {
  return (
    <NotificationListItem
      title={getTitle(notification)}
      subtitle={getSubtitle(notification)}
      icon={<NotificationIcon notification={notification} />}
      timestamp={notification.timestamp}
      showSeparator={showSeparator}
      accessoryType={accessoryType}
      testID={testID}
    />
  )
}

export default BalanceChangeItem

import React, {FC} from 'react'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import MovementIndicator from 'components/MovementIndicator'
import {TxType} from 'screens/activity/ActivityList'
import {
  isTransactionERC20,
  isTransactionNormal
} from '@avalabs/wallet-react-components'
import {truncateAddress} from 'utils/Utils'

type Props = {
  tx: TxType
  onPress?: () => void
}

const ActivityListItem: FC<Props> = ({tx, onPress}) => {
  if (isTransactionNormal(tx)) {
    const isContractCall = tx?.input !== '0x'
    return (
      <AvaListItem.Base
        title={isContractCall ? 'Contract Call' : 'Avalanche'}
        subtitle={
          tx?.isSender
            ? `To: ${truncateAddress(tx.to ?? '')}`
            : `From: ${truncateAddress(tx.from) ?? ''}`
        }
        leftComponent={<MovementIndicator metric={tx.isSender ? -1 : 0} />}
        rightComponent={
          isContractCall || (
            <AvaText.ActivityTotal>
              {tx.isSender ? '-' : '+'}
              {tx.amountDisplayValue} AVAX
            </AvaText.ActivityTotal>
          )
        }
        embedInCard
        onPress={onPress}
      />
    )
  } else if (isTransactionERC20(tx)) {
    const sign = tx.isSender ? '-' : '+'
    return (
      <AvaListItem.Base
        title={tx.tokenName}
        leftComponent={<MovementIndicator metric={tx.isSender ? -1 : 0} />}
        subtitle={
          tx?.isSender
            ? `To: ${truncateAddress(tx.to ?? '')}`
            : `From: ${truncateAddress(tx.from) ?? ''}`
        }
        rightComponent={
          <AvaText.ActivityTotal ellipsizeMode={'tail'}>
            {sign + tx.amountDisplayValue} {tx.tokenSymbol}
          </AvaText.ActivityTotal>
        }
        embedInCard
        onPress={onPress}
      />
    )
  }
  return null
}

export default ActivityListItem

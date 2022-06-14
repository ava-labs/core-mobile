import React, { FC } from 'react'
import { View } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Switch from 'components/Switch'
import Avatar from 'components/Avatar'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsZeroBalanceWhiteListed,
  toggleWhitelist
} from 'store/settings/zeroBalance'

type Props = {
  id: string
  balance?: string
  name: string
  image?: string
  symbol?: string
  position: number
  onPress?: () => void
}

const TokenManagementItem: FC<Props> = ({
  id,
  balance,
  name,
  image,
  symbol
}) => {
  const dispatch = useDispatch()
  const isZeroBalanceWhiteListed = useSelector(
    selectIsZeroBalanceWhiteListed(id)
  )

  function handleChange() {
    dispatch(toggleWhitelist(id))
  }

  const tokenLogo = (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Avatar.Custom name={name} symbol={symbol} logoUri={image} showBorder />
    </View>
  )

  const rightComponent = () => {
    if (balance === undefined) {
      return (
        <Switch value={isZeroBalanceWhiteListed} onValueChange={handleChange} />
      )
    } else {
      return <AvaText.Body2>{balance}</AvaText.Body2>
    }
  }

  return (
    <AvaListItem.Base
      title={name}
      leftComponent={tokenLogo}
      rightComponent={rightComponent()}
    />
  )
}

export default TokenManagementItem

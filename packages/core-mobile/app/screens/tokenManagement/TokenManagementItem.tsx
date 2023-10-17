import React, { FC } from 'react'
import { View } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Switch from 'components/Switch'
import Avatar from 'components/Avatar'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsTokenBlacklisted, toggleBlacklist } from 'store/portfolio'

type Props = {
  id: string
  name: string
  image?: string
  symbol?: string
  onPress?: () => void
}

const TokenManagementItem: FC<Props> = ({ id, name, image, symbol }) => {
  const dispatch = useDispatch()

  const isBlacklisted = useSelector(selectIsTokenBlacklisted(id))

  function handleChange() {
    dispatch(toggleBlacklist(id))
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

  const rightComponent = (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Switch value={!isBlacklisted} onValueChange={handleChange} />
    </View>
  )

  const title = (
    <View
      style={{
        flexGrow: 1,
        marginRight: 15
      }}>
      <AvaText.Heading3 ellipsizeMode="tail">{name}</AvaText.Heading3>
      <AvaText.Body2 numberOfLines={1} ellipsizeMode="tail">
        {symbol}
      </AvaText.Body2>
    </View>
  )

  return (
    <AvaListItem.Base
      title={title}
      leftComponent={tokenLogo}
      rightComponent={rightComponent}
      titleAlignment="flex-start"
      rightComponentVerticalAlignment="center"
    />
  )
}

export default TokenManagementItem

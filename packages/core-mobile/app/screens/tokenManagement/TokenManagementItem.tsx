import React, { FC } from 'react'
import { View } from 'react-native'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Switch from 'components/Switch'
import Avatar from 'components/Avatar'
import { useDispatch, useSelector } from 'react-redux'
import { selectTokenVisibility, toggleTokenVisibility } from 'store/portfolio'
import { MaliciousTokenIconWithWarning } from 'components/MaliciousTokenIconWithWarning'
import { isTokenVisible } from 'store/balance/utils'
import { LocalTokenWithBalance } from 'store/balance'
import { isTokenMalicious } from 'utils/isTokenMalicious'

type Props = {
  token: LocalTokenWithBalance
}

const TokenManagementItem: FC<Props> = ({ token }) => {
  const dispatch = useDispatch()

  const tokenVisibility = useSelector(selectTokenVisibility)

  const isSwitchOn = isTokenVisible(tokenVisibility, token)
  const isMalicious = isTokenMalicious(token)

  function handleChange(): void {
    dispatch(toggleTokenVisibility({ tokenId: token.localId }))
  }

  const tokenLogo = (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Avatar.Custom
        name={token.name}
        symbol={token.symbol}
        logoUri={token.logoUri}
        showBorder
      />
    </View>
  )

  const rightComponent = (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8
      }}>
      {isMalicious && (
        <MaliciousTokenIconWithWarning contentWidth={200} position="left" />
      )}
      <Switch
        testID={
          isSwitchOn ? `${token.name}_displayed` : `${token.name}_blocked`
        }
        value={isSwitchOn}
        onValueChange={handleChange}
      />
    </View>
  )

  const title = (
    <View
      style={{
        flexGrow: 1,
        marginRight: 15
      }}>
      <AvaText.Heading3 ellipsizeMode="tail">{token.name}</AvaText.Heading3>
      <AvaText.Body2 numberOfLines={1} ellipsizeMode="tail">
        {token.symbol}
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

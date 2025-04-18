import React, { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectTokenVisibility, toggleTokenVisibility } from 'store/portfolio'
import { isTokenVisible } from 'store/balance/utils'
import { LocalTokenWithBalance } from 'store/balance'
import { Text, Toggle, useTheme, View } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { LogoWithNetwork } from './LogoWithNetwork'

type Props = {
  token: LocalTokenWithBalance
}

const TokenManagementItem: FC<Props> = ({ token }) => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const tokenVisibility = useSelector(selectTokenVisibility)
  const isToggledOn = isTokenVisible(tokenVisibility, token)

  function handleChange(): void {
    dispatch(toggleTokenVisibility({ tokenId: token.localId }))
  }

  return (
    <View
      sx={{
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '$surfacePrimary',
        justifyContent: 'space-between'
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1
        }}>
        <LogoWithNetwork
          token={token}
          outerBorderColor={colors.$surfacePrimary}
        />
        <View
          sx={{
            marginLeft: 16,
            marginRight: 16
          }}>
          <Text
            variant="buttonMedium"
            numberOfLines={1}
            ellipsizeMode="tail"
            sx={{ lineHeight: 16 }}>
            {token.name}
          </Text>
          <View sx={{ flexDirection: 'row', marginTop: 2 }}>
            <Text
              variant="subtitle2"
              ellipsizeMode="tail"
              sx={{ color: '$textSecondary' }}>
              {token.balanceDisplayValue}
            </Text>
            <Space x={4} />
            <Text
              variant="subtitle2"
              numberOfLines={1}
              ellipsizeMode="tail"
              sx={{ color: '$textSecondary' }}>
              {token.symbol}
            </Text>
          </View>
        </View>
      </View>
      <View
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 23
        }}>
        <Toggle
          testID={
            isToggledOn ? `${token.name}_displayed` : `${token.name}_blocked`
          }
          value={isToggledOn}
          onValueChange={handleChange}
        />
      </View>
    </View>
  )
}

export default TokenManagementItem

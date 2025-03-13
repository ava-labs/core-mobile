import {
  Icons,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { FC, useCallback, useMemo } from 'react'
import Animated from 'react-native-reanimated'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import {
  assetPDisplayNames,
  assetXDisplayNames,
  LocalTokenWithBalance
} from 'store/balance'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { PChainBalance, XChainBalances } from '@avalabs/glacier-sdk'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { xpChainToken } from 'utils/units/knownTokens'
import { LogoWithNetwork } from './LogoWithNetwork'

type PChainBalanceType = keyof PChainBalance
type XChainBalanceType = keyof XChainBalances

interface Props {
  token?: LocalTokenWithBalance
}

const TokenDetail: FC<Props> = ({ token }): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const assetTypes = useMemo(() => {
    if (token && isTokenWithBalancePVM(token)) {
      return Object.keys(token.balancePerType)
        .sort((a, b) => {
          return Number(
            (token.balancePerType[b as PChainBalanceType] ?? 0n) -
              (token.balancePerType[a as PChainBalanceType] ?? 0n)
          )
        })
        .filter(k => (token.balancePerType[k as PChainBalanceType] ?? 0) > 0)
    }
    if (token && isTokenWithBalanceAVM(token)) {
      return Object.keys(token.balancePerType)
        .sort((a, b) => {
          return Number(
            (token.balancePerType[b as XChainBalanceType] ?? 0n) -
              (token.balancePerType[a as XChainBalanceType] ?? 0n)
          )
        })
        .filter(k => (token.balancePerType[k as XChainBalanceType] ?? 0) > 0)
    }
    return []
  }, [token])

  const getBalanceAndAssetName = useCallback(
    (item: string) => {
      const balance =
        token && isTokenWithBalancePVM(token)
          ? token.balancePerType[item as PChainBalanceType]
          : token && isTokenWithBalanceAVM(token)
          ? token.balancePerType[item as XChainBalanceType]
          : 0
      const assetName =
        token && isTokenWithBalancePVM(token)
          ? assetPDisplayNames[item]
          : token && isTokenWithBalanceAVM(token)
          ? assetXDisplayNames[item]
          : ''
      return { balance, assetName }
    },
    [token]
  )

  const renderItem = useCallback(
    (item: string, index: number): React.JSX.Element => {
      const { balance, assetName } = getBalanceAndAssetName(item)

      const balanceInAvax = balance
        ? new TokenUnit(balance, xpChainToken.maxDecimals, xpChainToken.symbol)
        : undefined
      const formattedBalance =
        balanceInAvax && token?.priceInCurrency
          ? '$' +
            balanceInAvax
              ?.mul(token?.priceInCurrency ?? 0)
              .toDisplay({ fixedDp: 2 })
          : UNKNOWN_AMOUNT

      const isAvailableBalanceType =
        item === 'unlockedUnstaked' || item === 'unlocked'

      return (
        <Animated.View
          entering={getListItemEnteringAnimation(index)}
          layout={SPRING_LINEAR_TRANSITION}>
          <View>
            <View
              sx={{
                borderRadius: 18,
                paddingLeft: 16,
                paddingRight: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '$surfaceSecondary',
                marginBottom: 12
              }}>
              {token && isAvailableBalanceType ? (
                <LogoWithNetwork token={token} />
              ) : (
                <View
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    backgroundColor: '$borderPrimary',
                    borderColor: '$borderPrimary'
                  }}>
                  <Icons.Custom.Psychiatry
                    width={24}
                    height={24}
                    color={colors.$textPrimary}
                  />
                </View>
              )}
              <View
                sx={{
                  flexGrow: 1,
                  marginHorizontal: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                }}>
                <View
                  sx={{
                    flexShrink: 1
                  }}>
                  <Text
                    variant="buttonMedium"
                    numberOfLines={1}
                    sx={{ flex: 1 }}>
                    {assetName}
                  </Text>
                  <Text
                    variant="body2"
                    sx={{ lineHeight: 16, flex: 1 }}
                    ellipsizeMode="tail"
                    numberOfLines={1}>
                    {balanceInAvax?.toDisplay()} {xpChainToken.symbol}
                  </Text>
                </View>
                <View
                  sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    variant="buttonMedium"
                    numberOfLines={1}
                    sx={{ lineHeight: 18, marginBottom: 1 }}>
                    {formattedBalance}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      )
    },
    [colors.$textPrimary, getBalanceAndAssetName, token]
  )

  const renderHeader = (): JSX.Element => {
    return (
      <Text variant="heading3" sx={{ marginBottom: 12 }}>
        Token breakdown
      </Text>
    )
  }

  return (
    <CollapsibleTabs.FlatList
      style={{ paddingHorizontal: 16, marginTop: 23 }}
      contentContainerStyle={{ paddingBottom: 16 }}
      data={assetTypes}
      renderItem={item => renderItem(item.item, item.index)}
      ListHeaderComponent={renderHeader()}
      showsVerticalScrollIndicator={false}
      keyExtractor={item => item}
    />
  )
}

export default TokenDetail

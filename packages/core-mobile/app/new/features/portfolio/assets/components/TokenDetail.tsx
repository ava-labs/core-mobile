import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { PChainBalance, XChainBalances } from '@avalabs/glacier-sdk'
import {
  Icons,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import React, { FC, useCallback, useMemo } from 'react'
import Animated from 'react-native-reanimated'
import {
  assetPDisplayNames,
  assetXDisplayNames,
  LocalTokenWithBalance
} from 'store/balance'
import { xpChainToken } from 'utils/units/knownTokens'
import { BalanceText } from 'common/components/BalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
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
  const { formatCurrency } = useFormatCurrency()

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
    ({ item }: { item: string }): React.JSX.Element => {
      const { balance, assetName } = getBalanceAndAssetName(item)

      const balanceInAvax = balance
        ? new TokenUnit(balance, xpChainToken.maxDecimals, xpChainToken.symbol)
        : undefined
      const formattedBalance =
        balanceInAvax && token?.priceInCurrency
          ? formatCurrency({
              amount: balanceInAvax
                .mul(token.priceInCurrency)
                .toDisplay({ fixedDp: 2, asNumber: true })
            })
          : UNKNOWN_AMOUNT

      const isAvailableBalanceType =
        item === 'unlockedUnstaked' || item === 'unlocked'

      return (
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
            <LogoWithNetwork
              token={token}
              outerBorderColor={colors.$surfaceSecondary}
            />
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
              <Text variant="buttonMedium" numberOfLines={1} sx={{ flex: 1 }}>
                {assetName}
              </Text>
              <BalanceText
                variant="body2"
                sx={{ lineHeight: 16, flex: 1 }}
                ellipsizeMode="tail"
                isCurrency={false}
                maskType="covered"
                numberOfLines={1}>
                {balanceInAvax?.toDisplay()} {xpChainToken.symbol}
              </BalanceText>
            </View>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <BalanceText
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ lineHeight: 18, marginBottom: 1 }}>
                {formattedBalance}
              </BalanceText>
            </View>
          </View>
        </View>
      )
    },
    [
      colors.$textPrimary,
      colors.$surfaceSecondary,
      getBalanceAndAssetName,
      token,
      formatCurrency
    ]
  )

  const renderHeader = (): JSX.Element => {
    return (
      <Text variant="heading3" sx={{ marginBottom: 12 }}>
        Token breakdown
      </Text>
    )
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      layout={SPRING_LINEAR_TRANSITION}>
      <CollapsibleTabs.FlatList
        style={{
          paddingTop: 4
        }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16
        }}
        data={assetTypes}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader()}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item}
      />
    </Animated.View>
  )
}

export default TokenDetail

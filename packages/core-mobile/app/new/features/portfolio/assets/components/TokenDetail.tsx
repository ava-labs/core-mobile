import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { PChainBalance, XChainBalances } from '@avalabs/glacier-sdk'
import { SPRING_LINEAR_TRANSITION, Text, View } from '@avalabs/k2-alpine'
import { BalanceText } from 'common/components/BalanceText'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { FC, useCallback, useMemo } from 'react'
import Animated from 'react-native-reanimated'
import {
  assetPDisplayNames,
  assetXDisplayNames,
  LocalTokenWithBalance
} from 'store/balance'
import { xpChainToken } from 'utils/units/knownTokens'

type PChainBalanceType = keyof PChainBalance
type XChainBalanceType = keyof XChainBalances

interface Props {
  token?: LocalTokenWithBalance
}

const TokenDetail: FC<Props> = ({ token }): React.JSX.Element => {
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

  const data = useMemo(() => {
    const isPChainToken = token && isTokenWithBalancePVM(token)
    const isXChainToken = token && isTokenWithBalanceAVM(token)

    if (isPChainToken) {
      return Object.keys(token.balancePerType).sort((a, b) => {
        return Number(
          (token.balancePerType[b as PChainBalanceType] ?? 0n) -
            (token.balancePerType[a as PChainBalanceType] ?? 0n)
        )
      })
    }

    if (isXChainToken) {
      return Object.keys(token.balancePerType).sort((a, b) => {
        return Number(
          (token.balancePerType[b as XChainBalanceType] ?? 0n) -
            (token.balancePerType[a as XChainBalanceType] ?? 0n)
        )
      })
    }
    return []
  }, [token])

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }): React.JSX.Element => {
      const { balance, assetName } = getBalanceAndAssetName(item)

      const balanceInAvax = balance
        ? new TokenUnit(balance, xpChainToken.maxDecimals, xpChainToken.symbol)
        : undefined
      const formattedBalanceInAvax =
        balanceInAvax?.toDisplay({
          fixedDp: 2,
          asNumber: true
        }) ?? 0

      const isFirst = index === 0
      const isLast = index === data.length - 1

      const containerSx = {
        paddingHorizontal: 16,
        backgroundColor: '$surfaceSecondary',
        ...(isFirst && { borderTopLeftRadius: 16, borderTopRightRadius: 16 }),
        ...(isLast && {
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16
        })
      }

      return (
        <View sx={containerSx}>
          <View
            sx={{
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: '$borderPrimary',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: 48
            }}>
            <Text variant="subtitle2" numberOfLines={1} sx={{ fontSize: 16 }}>
              {assetName}
            </Text>
            <BalanceText
              variant="subtitle2"
              numberOfLines={1}
              sx={{
                color: '$textSecondary',
                fontSize: 16
              }}>
              {formattedBalanceInAvax} {xpChainToken.symbol}
            </BalanceText>
          </View>
        </View>
      )
    },
    [getBalanceAndAssetName, data.length]
  )

  const renderHeader = useCallback((): JSX.Element => {
    return <></>

    // TODO: Add after ledger is implemented
    // return (
    //   <View sx={{ marginBottom: 12, marginTop: 8 }}>
    //     <GroupList
    //       data={[
    //         {
    //           title:
    //             'UTXOs across multiple addresses. View all of your balances and UTXOs',
    //           leftIcon: <Icons.Action.Info color={colors.$textPrimary} />,
    //           onPress: () => {
    //             // console.log('info')
    //           }
    //         }
    //       ]}
    //     />
    //   </View>
    // )
  }, [])

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      layout={SPRING_LINEAR_TRANSITION}>
      <CollapsibleTabs.FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16
        }}
        data={data}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item}
      />
    </Animated.View>
  )
}

export default TokenDetail

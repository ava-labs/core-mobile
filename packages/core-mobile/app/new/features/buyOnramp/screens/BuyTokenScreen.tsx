import { GroupList, GroupListItem } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { TokenLogo } from 'common/components/TokenLogo'
import { Space } from 'common/components/Space'
import { TokenSymbol } from 'store/network'
import { LoadingState } from 'common/components/LoadingState'
import { useBuy } from '../hooks/useBuy'

export const BuyTokenScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const { navigateToBuyAvax, navigateToBuyUsdc, isLoading } = useBuy()

  const selectOtherToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectBuyToken')
  }, [navigate])

  const data = useMemo(() => {
    const _data: GroupListItem[] = [
      {
        title: TokenSymbol.AVAX,
        leftIcon: <TokenLogo symbol={TokenSymbol.AVAX} />,
        onPress: navigateToBuyAvax
      },
      {
        title: TokenSymbol.USDC,
        leftIcon: <TokenLogo symbol={TokenSymbol.USDC} />,
        onPress: navigateToBuyUsdc
      },
      {
        title: 'Select other token',
        onPress: selectOtherToken
      }
    ]

    return _data
  }, [navigateToBuyAvax, navigateToBuyUsdc, selectOtherToken])

  return (
    <ScrollScreen
      title={`What token do\nyou want to buy?`}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
      <Space y={16} />
      {isLoading ? (
        <LoadingState sx={{ flexGrow: 1 }} />
      ) : (
        <GroupList
          data={data}
          titleSx={{
            fontFamily: 'Inter-Regular',
            fontSize: 16,
            lineHeight: 22,
            fontWeight: 500
          }}
          textContainerSx={{
            paddingVertical: 4
          }}
          separatorMarginRight={16}
        />
      )}
    </ScrollScreen>
  )
}

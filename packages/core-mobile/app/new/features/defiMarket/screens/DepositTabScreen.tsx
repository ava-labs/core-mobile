import {
  AddCard,
  GRID_GAP,
  SCREEN_WIDTH,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import {
  getListItemEnteringAnimation,
  getListItemExitingAnimation
} from 'common/utils/animations'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { useDeposits } from 'hooks/earn/useDeposits'
import { useRouter } from 'expo-router'
import { Placeholder } from 'common/components/Placeholder'
import { LoadingState } from 'common/components/LoadingState'
import { DropdownSelections } from 'common/components/DropdownSelections'
import CoreAppIconLight from '../../../assets/icons/core-app-icon-light.svg'
import CoreAppIconDark from '../../../assets/icons/core-app-icon-dark.svg'
import { DefiMarket } from '../types'
import { DepositCard } from '../components/DepositCard'
import { useDepositsFilterAndSort } from '../hooks/useDepositsFilterAndSort'
import { useAvailableRewards } from '../hooks/useAvailableRewards'
import { useClaimRewards } from '../hooks/useClaimRewards'
import { RewardsBanner } from '../components/RewardsBanner'

const DepositTabScreen = ({
  onScroll,
  onHeaderLayout,
  animatedHeaderStyle,
  containerStyle,
  isActive
}: {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent> | number) => void
  onHeaderLayout: (event: LayoutChangeEvent) => void
  animatedHeaderStyle: { opacity: number }
  containerStyle?: StyleProp<ViewStyle>
  isActive: boolean
}): JSX.Element => {
  const { navigate } = useRouter()
  const { deposits, isLoading, refresh, isRefreshing } = useDeposits()
  const { theme } = useTheme()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const scrollOffsetRef = useRef({ x: 0, y: 0 })
  const dispatch = useDispatch()

  const {
    data: filteredDeposits,
    filter,
    sort
  } = useDepositsFilterAndSort({ deposits })

  const { data: availableRewards } = useAvailableRewards()
  const { claimAllRewards, isLoading: isClaimingRewards } = useClaimRewards()

  const data: DepositCardType[] = useMemo(() => {
    return isLoading ? [] : [StaticCard.Add, ...filteredDeposits]
  }, [filteredDeposits, isLoading])

  const handleAddDeposit = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/deposit' })
  }, [navigate])

  const handlePressDeposit = useCallback(
    (item: DefiMarket) => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/depositDetail',
        params: { marketId: item.uniqueMarketId }
      })
    },
    [navigate]
  )

  const handleWithdrawDeposit = useCallback(
    (deposit: DefiMarket) => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/withdraw/selectAmount',
        params: { marketId: deposit.uniqueMarketId }
      })
    },
    [navigate]
  )

  const renderItem = useCallback(
    ({
      item,
      index
    }: ListRenderItemInfo<DepositCardType>): JSX.Element | null => {
      let content = null
      if (item === StaticCard.Add) {
        content = <AddCard width={CARD_WIDTH} onPress={handleAddDeposit} />
      } else {
        content = (
          <DepositCard
            market={item}
            width={CARD_WIDTH}
            onPress={() => handlePressDeposit(item)}
            onWithdrawPress={() => handleWithdrawDeposit(item)}
          />
        )
      }

      if (content) {
        return (
          <Animated.View
            style={{
              marginBottom: 14,
              marginRight: index % 2 === 0 ? 6 : 16,
              marginLeft: index % 2 !== 0 ? 6 : 16
            }}
            entering={getListItemEnteringAnimation(index)}
            exiting={getListItemExitingAnimation(index)}
            layout={SPRING_LINEAR_TRANSITION}>
            {content}
          </Animated.View>
        )
      }

      return null
    },
    [handleAddDeposit, handlePressDeposit, handleWithdrawDeposit]
  )

  const overrideProps = {
    contentContainerStyle: containerStyle
  }

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        sx={{
          backgroundColor: theme.colors.$surfacePrimary,
          paddingBottom: 16
        }}>
        <Animated.View
          onLayout={onHeaderLayout}
          style={[
            {
              paddingHorizontal: 14,
              marginTop: 6,
              marginBottom: 10,
              backgroundColor: theme.colors.$surfacePrimary,
              gap: 7
            },
            animatedHeaderStyle
          ]}>
          <Text variant="heading2">Deposit</Text>
          <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
            Earn yield by depositing crypto into lending protocols and withdraw
            anytime.
          </Text>
        </Animated.View>
        {availableRewards.hasRewardsToClaim && (
          <RewardsBanner
            availableRewards={availableRewards}
            onClaimPress={claimAllRewards}
            isClaiming={isClaimingRewards}
          />
        )}
        <DropdownSelections
          filter={filter}
          sort={sort}
          sx={{ paddingHorizontal: 16, marginTop: 4 }}
        />
      </View>
    )
  }, [
    theme.colors.$surfacePrimary,
    onHeaderLayout,
    animatedHeaderStyle,
    filter,
    sort,
    availableRewards,
    claimAllRewards,
    isClaimingRewards
  ])

  useEffect(() => {
    if (scrollOffsetRef.current && isActive) {
      onScroll(scrollOffsetRef.current.y)
    }
  }, [isActive, onScroll])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset
      onScroll(event)
    },
    [onScroll]
  )

  if (isDeveloperMode) {
    return (
      <Placeholder
        sx={{ flex: 1, paddingBottom: 50 }}
        icon={
          <View style={{ marginBottom: 0 }}>
            {theme.isDark ? <CoreAppIconLight /> : <CoreAppIconDark />}
            <View
              style={{
                position: 'absolute',
                bottom: -15,
                right: -14
              }}>
              <Text variant="heading6" sx={{ fontSize: 36, lineHeight: 44 }}>
                ⚠️
              </Text>
            </View>
          </View>
        }
        title={`Deposit is only\navailable on mainnet`}
        description="Earn yield by depositing crypto into lending protocols and withdraw anytime."
        button={{
          title: 'Turn off testnet',
          onPress: () => {
            dispatch(toggleDeveloperMode())
          }
        }}
      />
    )
  }

  return (
    <FlashList
      onScroll={handleScroll}
      overrideProps={overrideProps}
      data={data}
      numColumns={2}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyExtractor={item =>
        item === StaticCard.Add ? 'add-deposit' : item.uniqueMarketId
      }
      removeClippedSubviews={true}
      extraData={{ isDark: theme.isDark }} // force re-render when theme changes
      onRefresh={refresh}
      refreshing={isRefreshing}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={<LoadingState sx={{ height: 500 }} />}
    />
  )
}

enum StaticCard {
  Add = 'Add'
}
type DepositCardType = StaticCard | DefiMarket
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

export default DepositTabScreen

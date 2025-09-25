import { PChainTransaction, SortOrder } from '@avalabs/glacier-sdk'
import {
  AddCard,
  ClaimCard,
  CompletedCard,
  GRID_GAP,
  ProgressCard,
  SCREEN_WIDTH,
  SPRING_LINEAR_TRANSITION,
  Text,
  useMotion,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AppState,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isCompleted, isOnGoing } from 'utils/earn/status'
import { useStakes } from 'hooks/earn/useStakes'
import { useIsFocused } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { LoadingState } from 'common/components/LoadingState'
import { DropdownSelections } from 'common/components/DropdownSelections'
import CompleteCardBackgroundImageDark from '../../../assets/icons/complete-card-bg-dark.png'
import CompleteCardBackgroundImageLight from '../../../assets/icons/complete-card-bg-light.png'
import { getActiveStakeProgress, getStakeTitle } from '../utils'
import { useAddStake } from '../hooks/useAddStake'
import { useStakeFilterAndSort } from '../hooks/useStakeFilterAndSort'
import { Banner } from './Banner'

const StakeTabScreen = ({
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
  const [appState, setAppState] = useState(AppState.currentState)
  const isFocused = useIsFocused()
  const isMotionActive = useMemo(
    () =>
      appState === 'active' && isFocused && Platform.OS === 'ios' && isActive,
    [appState, isFocused, isActive]
  )

  const [selectedSort, setSelectedSort] = useState<SortOrder>(SortOrder.DESC)
  const motion = useMotion(isMotionActive)
  const {
    data: _data,
    isRefreshing,
    pullToRefresh: onRefresh,
    isLoading
  } = useStakes(selectedSort)
  const stakes = useMemo(() => _data ?? [], [_data])
  const isEmpty = stakes.length === 0
  const { theme } = useTheme()
  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)

  const completeCardBackground = theme.isDark
    ? CompleteCardBackgroundImageDark
    : CompleteCardBackgroundImageLight

  const claimableInAvax = useGetClaimableBalance()

  const {
    data: filteredStakes,
    filter,
    sort
  } = useStakeFilterAndSort({
    stakes
  })

  const data: StakeCardType[] = useMemo(() => {
    const result = [StaticCard.Add]
    if (claimableInAvax?.gt(0.05)) {
      result.push(StaticCard.Claim)
    }
    return [...result, ...filteredStakes]
  }, [filteredStakes, claimableInAvax])

  const { addStake, canAddStake } = useAddStake()
  const scrollOffsetRef = useRef({ x: 0, y: 0 })

  const handleClaim = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/claimStakeReward')
  }, [navigate])

  const handlePressStake = useCallback(
    (txHash: string) => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/stakeDetail', params: { txHash } })
    },
    [navigate]
  )

  const renderItem = useCallback(
    ({
      item,
      index
    }: ListRenderItemInfo<StakeCardType>): JSX.Element | null => {
      let content = null
      if (item === StaticCard.Add) {
        content = (
          <AddCard
            width={CARD_WIDTH}
            onPress={addStake}
            disabled={!canAddStake}
          />
        )
      } else if (item === StaticCard.Claim) {
        content = (
          <ClaimCard
            onPress={handleClaim}
            title={`${claimableInAvax?.toDisplay({
              fixedDp: 2
            })} AVAX reward unlocked`}
            width={CARD_WIDTH}
            backgroundImageSource={completeCardBackground}
          />
        )
      } else {
        const now = new Date()

        if (isCompleted(item, now)) {
          const title = getStakeTitle({
            stake: item,
            pChainNetworkToken,
            isActive: false
          })

          content = (
            <CompletedCard
              onPress={() => handlePressStake(item.txHash)}
              title={title}
              width={CARD_WIDTH}
            />
          )
        } else if (isOnGoing(item, now)) {
          const title = getStakeTitle({
            stake: item,
            pChainNetworkToken,
            isActive: true
          })

          content = (
            <ProgressCard
              title={title}
              progress={getActiveStakeProgress(item, now)}
              width={CARD_WIDTH}
              motion={motion}
              onPress={() => handlePressStake(item.txHash)}
            />
          )
        }
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
            layout={SPRING_LINEAR_TRANSITION}>
            {content}
          </Animated.View>
        )
      }

      return null
    },
    [
      claimableInAvax,
      completeCardBackground,
      motion,
      canAddStake,
      addStake,
      handleClaim,
      handlePressStake,
      pChainNetworkToken
    ]
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
              paddingHorizontal: 16,
              marginTop: 6,
              marginBottom: 16,
              backgroundColor: theme.colors.$surfacePrimary,
              gap: 7
            },
            animatedHeaderStyle
          ]}>
          <Text variant="heading2">Stake</Text>
          {isEmpty && (
            <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
              Lock AVAX in the network for a set period of time and generate
              staking rewards.
            </Text>
          )}
        </Animated.View>
        {isEmpty === false && <Banner />}
        <DropdownSelections
          filter={filter}
          sort={sort}
          sx={{ paddingHorizontal: 16, marginTop: 20 }}
        />
      </View>
    )
  }, [
    theme.colors.$surfacePrimary,
    onHeaderLayout,
    animatedHeaderStyle,
    isEmpty,
    filter,
    sort
  ])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset
      onScroll(event)
    },
    [onScroll]
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    if (scrollOffsetRef.current && isActive) {
      onScroll(scrollOffsetRef.current.y)
    }
  }, [isActive, onScroll])

  useEffect(() => {
    setSelectedSort(sort.selected as SortOrder)
  }, [sort.selected])

  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <FlashList
      onScroll={handleScroll}
      overrideProps={overrideProps}
      data={data}
      numColumns={2}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyExtractor={(_, index) => index.toString()}
      removeClippedSubviews={true}
      extraData={{ isDark: theme.isDark, motion }} // force re-render when theme changes
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      ListHeaderComponent={renderHeader}
    />
  )
}

enum StaticCard {
  Add = 'Add',
  Claim = 'Claim'
}
type StakeCardType = StaticCard | PChainTransaction
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

export default StakeTabScreen

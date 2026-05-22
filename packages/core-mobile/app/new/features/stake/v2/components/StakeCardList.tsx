import { PChainTransaction, SortOrder } from '@avalabs/glacier-sdk'
import {
  AddCard,
  GRID_GAP,
  SCREEN_WIDTH,
  useMotion,
  useTheme
} from '@avalabs/k2-alpine'
import { useIsFocused } from '@react-navigation/native'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import { LoadingState } from 'common/components/LoadingState'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { format, fromUnixTime } from 'date-fns'
import { useRouter } from 'expo-router'
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import { useStakes } from 'hooks/earn/useStakes'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AppState,
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
import { selectSelectedCurrency } from 'store/settings/currency'
import { isCompleted, isOnGoing } from 'utils/earn/status'
import { truncateNodeId } from 'utils/Utils'
import { useAddStake } from '../../hooks/useAddStake'
import { useStakeFilterAndSort } from '../../hooks/useStakeFilterAndSort'
import { getActiveStakeProgress, getStakedAmount } from '../../utils'
import { getStakeTitle } from '../utils'
import { StakeCard } from './StakeCard'

export interface StakeCardListHeaderProps {
  isEmpty: boolean
  filter: ReturnType<typeof useStakeFilterAndSort>['filter']
  sort: ReturnType<typeof useStakeFilterAndSort>['sort']
}

export interface StakeCardListProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent> | number) => void
  containerStyle?: StyleProp<ViewStyle>
  isActive?: boolean
  renderHeader: (props: StakeCardListHeaderProps) => JSX.Element
}

export const StakeCardList = ({
  onScroll,
  containerStyle,
  isActive = true,
  renderHeader
}: StakeCardListProps): JSX.Element => {
  const { navigate } = useRouter()
  const [appState, setAppState] = useState(AppState.currentState)
  const isFocused = useIsFocused()
  const isMotionActive = useMemo(
    () =>
      appState === 'active' && isFocused && Platform.OS === 'ios' && isActive,
    [appState, isFocused, isActive]
  )
  const motion = useMotion(isMotionActive)

  const [selectedSort, setSelectedSort] = useState<SortOrder>(SortOrder.DESC)
  const {
    data: _data,
    isRefreshing,
    pullToRefresh: onRefresh,
    isLoading
  } = useStakes(selectedSort)
  const stakes = useMemo(() => _data ?? [], [_data])
  const { theme } = useTheme()
  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)

  const avaxPrice = useAvaxPrice()
  const { formatTokenInCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const isEmpty = stakes.length === 0

  const {
    data: filteredStakes,
    filter,
    sort
  } = useStakeFilterAndSort({
    stakes
  })

  const data: StakeCardType[] = useMemo(
    () => [StaticCard.Add, ...filteredStakes],
    [filteredStakes]
  )

  const { addStake, canAddStake } = useAddStake()
  const scrollOffsetRef = useRef({ x: 0, y: 0 })

  const handlePressStake = useCallback(
    (txHash: string) => {
      navigate({ pathname: '/stakeDetail', params: { txHash } })
    },
    [navigate]
  )

  const renderStake = useCallback(
    (stake: PChainTransaction): JSX.Element | null => {
      const now = new Date()
      const stakeIsCompleted = isCompleted(stake, now)
      const stakeIsActive = isOnGoing(stake, now)

      if (!stakeIsCompleted && !stakeIsActive) {
        return null
      }

      const stakedTokenUnit = getStakedAmount(stake, pChainNetworkToken)
      const stakedAmount = stakedTokenUnit
        ? `${stakedTokenUnit.toDisplay({ fixedDp: 2 })} AVAX`
        : '— AVAX'
      const stakedUsdValue = stakedTokenUnit
        ? ensureCurrencySuffix(
            formatTokenInCurrency({
              amount: stakedTokenUnit
                .mul(avaxPrice)
                .toDisplay({ asNumber: true })
            }),
            selectedCurrency
          )
        : '—'

      return (
        <StakeCard
          variant={stakeIsCompleted ? 'completed' : 'active'}
          title={getStakeTitle({
            stake,
            pChainNetworkToken,
            isActive: stakeIsActive
          })}
          stakedAmount={stakedAmount}
          stakedUsdValue={stakedUsdValue}
          nodeId={truncateNodeId(stake.nodeId ?? '')}
          endDate={formatEndDate(stake.endTimestamp)}
          progress={
            stakeIsActive ? getActiveStakeProgress(stake, now) : undefined
          }
          motion={motion}
          // 'delegating' and 'validating' badges will be added as follow-up
          // work; for now every active stake is surfaced as a fast stake.
          badge={stakeIsActive ? 'fastStake' : undefined}
          width={CARD_WIDTH}
          onPress={() => handlePressStake(stake.txHash)}
        />
      )
    },
    [
      pChainNetworkToken,
      avaxPrice,
      formatTokenInCurrency,
      handlePressStake,
      selectedCurrency,
      motion
    ]
  )

  const renderItem = useCallback(
    ({
      item,
      index
    }: ListRenderItemInfo<StakeCardType>): JSX.Element | null => {
      let content: JSX.Element | null = null
      if (item === StaticCard.Add) {
        content = (
          <AddCard
            width={CARD_WIDTH}
            onPress={addStake}
            disabled={!canAddStake}
          />
        )
      } else {
        content = renderStake(item)
      }

      if (!content) return null

      return (
        <Animated.View
          style={{
            marginBottom: 14,
            marginHorizontal: GRID_GAP / 2
          }}
          entering={getListItemEnteringAnimation(index)}>
          {content}
        </Animated.View>
      )
    },
    [canAddStake, addStake, renderStake]
  )

  // Outer edge from screen: paddingHorizontal (9) + item marginHorizontal (7) = 16.
  // Inner gap between the two columns: 2 * item marginHorizontal (7) = GRID_GAP (14).
  const overrideProps = {
    contentContainerStyle: [
      { paddingHorizontal: 16 - GRID_GAP / 2 },
      containerStyle
    ]
  }

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset
      onScroll?.(event)
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
    if (scrollOffsetRef.current && isActive && onScroll) {
      // Sync scroll position when tab becomes active
      onScroll(scrollOffsetRef.current.y)
    }
  }, [isActive, onScroll])

  useEffect(() => {
    setSelectedSort(sort.selected as SortOrder)
  }, [sort.selected])

  // Pass the header as a JSX element rather than a component reference.
  // FlashList instantiates a function passed to `ListHeaderComponent` as
  // `<HeaderComponent />`, so a new function identity (which happens every
  // time `filter`/`sort` change here) reads as a new component *type* and
  // unmounts/remounts the entire header subtree — including <Banner />,
  // which retriggers the CircularProgress mount animation. Reconciling by
  // element type instead keeps the Banner instance alive across filter
  // changes.
  const headerElement = useMemo(
    () => renderHeader({ isEmpty, filter, sort }),
    [renderHeader, isEmpty, filter, sort]
  )

  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <FlashList
      onScroll={handleScroll}
      overrideProps={overrideProps}
      data={data}
      numColumns={2}
      masonry
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyExtractor={(item, index) =>
        item === StaticCard.Add
          ? 'add-card'
          : (item as PChainTransaction).txHash ?? index.toString()
      }
      removeClippedSubviews={true}
      extraData={{ isDark: theme.isDark, motion }}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      ListHeaderComponent={headerElement}
      // Negative margin cancels the contentContainer's paddingHorizontal for
      // the header, so its existing paddingHorizontal: 16 still aligns to the
      // screen edge instead of being indented by the column padding.
      ListHeaderComponentStyle={{ marginHorizontal: -(16 - GRID_GAP / 2) }}
    />
  )
}

enum StaticCard {
  Add = 'Add'
}
type StakeCardType = StaticCard | PChainTransaction
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

/**
 * `formatTokenInCurrency` only emits a trailing currency code for currencies
 * whose symbol equals the ISO code (e.g. CHF, NOK). For currencies like USD
 * the result is just "$327.64" with no suffix. The V2 stake card design wants
 * an explicit suffix in every case ("$327.64 USD"), so append the code unless
 * it's already there to avoid duplicates like "327.64 CHF CHF".
 */
const ensureCurrencySuffix = (formatted: string, currency: string): string =>
  formatted.endsWith(currency) ? formatted : `${formatted} ${currency}`

const formatEndDate = (endTimestamp?: number): string => {
  if (!endTimestamp) return '—'
  return format(fromUnixTime(endTimestamp), 'MM/dd/yyyy')
}

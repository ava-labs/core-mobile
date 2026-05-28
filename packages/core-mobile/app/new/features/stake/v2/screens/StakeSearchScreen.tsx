import { PChainTransaction, SortOrder } from '@avalabs/glacier-sdk'
import {
  AnimatedPressable,
  Chip,
  GRID_GAP,
  Image,
  SCREEN_WIDTH,
  SearchBar,
  Text,
  useMotion,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useIsFocused } from '@react-navigation/native'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import { DropdownMenu } from 'common/components/DropdownMenu'
import { ErrorState } from 'common/components/ErrorState'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import {
  getListItemEnteringAnimation,
  getListItemExitingAnimation
} from 'common/utils/animations'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { format, fromUnixTime } from 'date-fns'
import { useRouter } from 'expo-router'
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import { useStakes } from 'hooks/earn/useStakes'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AppState, Platform } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { isCompleted, isOnGoing } from 'utils/earn/status'
import { truncateNodeId } from 'utils/Utils'
import { STAKE_SORTS } from '../../hooks/useStakeFilterAndSort'
import { getActiveStakeProgress, getStakedAmount } from '../../utils'
import { StakeCard } from '../components/StakeCard'
import { getStakeTitle } from '../utils'

const magnifyingGlassIcon = require('../../../../assets/icons/magnifying_glass.png')
const cactusIcon = require('../../../../assets/icons/cactus.png')

// Match the home screen card width: outer screen padding (16) on each side,
// minus the GRID_GAP between the two columns, divided by 2.
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

/**
 * Modal search screen for stakes. Filters stakes by node ID (full or
 * truncated form) or by their formatted end date (MM/dd/yyyy). The
 * filter/sort/render logic intentionally does not reuse the home's
 * `StakeCardList` because that component bakes in the `AddCard` slot
 * and the chip filter row, which the search experience does not want.
 * The card-rendering math is duplicated as a contained block; if it
 * grows we should hoist it into a shared hook.
 */
export const StakeSearchScreen = (): JSX.Element => {
  const { back, canGoBack, navigate } = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const isFocused = useIsFocused()

  const [searchText, setSearchText] = useState('')
  const [selectedSort, setSelectedSort] = useState<SortOrder>(SortOrder.DESC)
  const [appState, setAppState] = useState(AppState.currentState)

  const isMotionActive = useMemo(
    () => appState === 'active' && isFocused && Platform.OS === 'ios',
    [appState, isFocused]
  )
  const motion = useMotion(isMotionActive)

  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)
  const avaxPrice = useAvaxPrice()
  const { formatTokenInCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const { data: _data } = useStakes(selectedSort)
  const stakes = useMemo(() => _data ?? [], [_data])

  const trimmedQuery = searchText.trim()
  const hasQuery = trimmedQuery.length > 0

  const filteredStakes = useMemo(() => {
    if (!hasQuery) return []
    const q = trimmedQuery.toLowerCase()
    return stakes.filter(stake => {
      const fullNodeId = (stake.nodeId ?? '').toLowerCase()
      const truncated = truncateNodeId(stake.nodeId ?? '').toLowerCase()
      const endDate = formatEndDate(stake.endTimestamp).toLowerCase()
      return (
        fullNodeId.includes(q) || truncated.includes(q) || endDate.includes(q)
      )
    })
  }, [stakes, trimmedQuery, hasQuery])

  const sortData = useMemo(() => {
    return STAKE_SORTS.map(s => ({
      key: s.key,
      items: s.items.map(i => ({
        id: i.id,
        title: i.title,
        selected: i.id === selectedSort
      }))
    }))
  }, [selectedSort])

  const handleCancel = useCallback(() => {
    if (canGoBack()) back()
  }, [back, canGoBack])

  const handlePressStake = useCallback(
    (txHash: string) => {
      navigate({ pathname: '/stakeDetail', params: { txHash } })
    },
    [navigate]
  )

  const renderStakeCard = useCallback(
    (stake: PChainTransaction): JSX.Element | null => {
      const now = new Date()
      const stakeIsCompleted = isCompleted(stake, now)
      const stakeIsActive = isOnGoing(stake, now)

      if (!stakeIsCompleted && !stakeIsActive) return null

      const stakedTokenUnit = getStakedAmount(stake, pChainNetworkToken)
      const stakedAmount = stakedTokenUnit
        ? `${stakedTokenUnit.toDisplay({ fixedDp: 2 })} AVAX`
        : `${UNKNOWN_AMOUNT} AVAX`
      const stakedUsdValue = stakedTokenUnit
        ? ensureCurrencySuffix(
            formatTokenInCurrency({
              amount: stakedTokenUnit
                .mul(avaxPrice)
                .toDisplay({ asNumber: true })
            }),
            selectedCurrency
          )
        : UNKNOWN_AMOUNT

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
      selectedCurrency,
      motion,
      handlePressStake
    ]
  )

  const renderItem = useCallback(
    ({
      item,
      index
    }: ListRenderItemInfo<PChainTransaction>): JSX.Element | null => {
      const content = renderStakeCard(item)
      if (!content) return null
      return (
        <Animated.View
          style={{
            marginBottom: 14,
            marginHorizontal: GRID_GAP / 2
          }}
          entering={getListItemEnteringAnimation(index)}
          exiting={getListItemExitingAnimation(index)}>
          {content}
        </Animated.View>
      )
    },
    [renderStakeCard]
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })
    return () => {
      subscription.remove()
    }
  }, [])

  const showZeroState = !hasQuery
  const showResults = hasQuery && filteredStakes.length > 0
  const showNoResults = hasQuery && !showResults

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12
        }}>
        <View sx={{ flex: 1 }}>
          <SearchBar
            searchText={searchText}
            onTextChanged={setSearchText}
            placeholder="Search"
            autoFocus
          />
        </View>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
          onPress={handleCancel}
          hitSlop={8}>
          <Text variant="body1" sx={{ color: '$textPrimary' }}>
            Cancel
          </Text>
        </AnimatedPressable>
      </View>

      {showZeroState && (
        <ErrorState
          sx={{
            flex: 1,
            justifyContent: 'flex-start',
            paddingTop: 96
          }}
          icon={
            <Image
              source={magnifyingGlassIcon}
              sx={{ width: 42, height: 42 }}
            />
          }
          title={'Find stakes\nby date or node ID'}
          description=""
        />
      )}

      {showNoResults && (
        <ErrorState
          sx={{
            flex: 1,
            justifyContent: 'flex-start',
            paddingTop: 96
          }}
          icon={<Image source={cactusIcon} sx={{ width: 42, height: 42 }} />}
          title="No results found"
          description=""
        />
      )}

      {showResults && (
        <FlashList
          data={filteredStakes}
          numColumns={2}
          masonry
          renderItem={renderItem}
          ListHeaderComponent={
            <View
              sx={{
                paddingHorizontal: GRID_GAP / 2,
                paddingBottom: 12
              }}>
              <DropdownMenu
                groups={sortData}
                onPressAction={(event: { nativeEvent: { event: string } }) =>
                  setSelectedSort(event.nativeEvent.event as SortOrder)
                }>
                <Chip
                  size="large"
                  hitSlop={8}
                  rightIcon="expandMore"
                  style={{ alignSelf: 'flex-start' }}>
                  Sort
                </Chip>
              </DropdownMenu>
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => item.txHash ?? index.toString()}
          removeClippedSubviews={true}
          extraData={{ isDark: theme.isDark, motion }}
          contentContainerStyle={{
            paddingHorizontal: 16 - GRID_GAP / 2,
            paddingBottom: insets.bottom + 16
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  )
}

const ensureCurrencySuffix = (formatted: string, currency: string): string =>
  formatted.endsWith(currency) ? formatted : `${formatted} ${currency}`

const formatEndDate = (endTimestamp?: number): string => {
  if (!endTimestamp) return '—'
  return format(fromUnixTime(endTimestamp), 'MM/dd/yyyy')
}

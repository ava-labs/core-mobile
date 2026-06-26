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
import { useIsFocused } from 'expo-router'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import { DropdownMenu } from 'common/components/DropdownMenu'
import { ErrorState } from 'common/components/ErrorState'
import Grabber from 'common/components/Grabber'
import {
  FORM_SHEET_FOCUS_BUFFER_MS,
  useAfterScreenEnterTransition
} from 'common/hooks/useAfterScreenEnterTransition'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { useRouter } from 'expo-router'
import { useStakes } from 'hooks/earn/useStakes'
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  AppState,
  Platform,
  ScrollView,
  ScrollViewProps,
  TextInput
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isCompleted, isOnGoing } from 'utils/earn/status'
import { truncateNodeId } from 'utils/Utils'
import { STAKE_SORTS } from '../../hooks/useStakeFilterAndSort'
import { useStakeCardRenderer } from '../hooks/useStakeCardRenderer'
import { formatEndDate } from '../utils/cardFormat'
import magnifyingGlassIcon from '../../../../assets/icons/magnifying_glass.png'
import cactusIcon from '../../../../assets/icons/cactus.png'

// Match the home screen card width: outer screen padding (16) on each side,
// minus the GRID_GAP between the two columns, divided by 2.
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

// Scroll component for the results FlashList. On Android, `nestedScrollEnabled`
// lets the list participate in the parent form sheet's nested scrolling so a
// vertical swipe scrolls the list instead of being captured by the sheet's
// drag-to-dismiss gesture (CP-14372).
//
// A plain ScrollView is used on purpose (NOT a keyboard-aware one): the search
// input is autofocused, so a KeyboardAwareScrollView would translate the list
// content up over the fixed SearchBar/Cancel header, hiding the search bar on
// scroll and covering the Cancel/X taps.
const RenderScrollComponent = React.forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => (
    <ScrollView
      {...props}
      ref={ref}
      nestedScrollEnabled={Platform.OS === 'android'}
    />
  )
)
RenderScrollComponent.displayName = 'StakeSearchScrollComponent'

/**
 * Modal search screen for stakes. Filters stakes by node ID (full or
 * truncated form) or by their formatted end date (MM/dd/yyyy).
 *
 * The screen intentionally doesn't reuse the home's `StakeCardList` — the
 * search experience has no AddCard slot and no chip filter row — but the
 * card cell itself is rendered through the shared `useStakeCardRenderer`
 * hook, so any card-level changes (formatting, motion, status badge, etc.)
 * automatically propagate to both surfaces.
 */
export const StakeSearchScreen = (): JSX.Element => {
  const { back, canGoBack, navigate } = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const isFocused = useIsFocused()

  const searchBarRef = useRef<TextInput>(null)
  const [searchText, setSearchText] = useState('')
  // Defer the filter input so keystrokes feel snappy even when the stake list
  // is large — React renders the SearchBar with the latest text, then catches
  // up on `filteredStakes` once the main thread is free.
  const deferredSearchText = useDeferredValue(searchText)
  const [selectedSort, setSelectedSort] = useState<SortOrder>(SortOrder.DESC)
  const [appState, setAppState] = useState(AppState.currentState)

  const isMotionActive = useMemo(
    () => appState === 'active' && isFocused && Platform.OS === 'ios',
    [appState, isFocused]
  )
  const motion = useMotion(isMotionActive)

  const { data: _data } = useStakes(selectedSort)
  const stakes = useMemo(() => _data ?? [], [_data])
  // Distinguish "no stakes received yet" from "received an empty list" so we
  // don't flash the cactus "No results found" panel during the initial fetch
  // or while react-query refetches after a sort change.
  const hasLoadedStakes = _data !== undefined

  // Single time snapshot — search results don't need to tick live and FlashList
  // recycles cells, so reusing one `now` avoids constructing a new Date per
  // visible card per render. The trade-off is that a stake whose endTimestamp
  // elapses while the modal is open keeps its mount-time active/completed
  // classification; acceptable here because the modal is short-lived.
  const now = useMemo(() => new Date(), [])

  const trimmedQuery = deferredSearchText.trim()
  const hasQuery = trimmedQuery.length > 0

  const filteredStakes = useMemo(() => {
    if (!hasQuery) return []
    const q = trimmedQuery.toLowerCase()
    return stakes.filter(stake => {
      // Drop stakes that aren't either currently active or completed — the
      // card renderer can't display them anyway. Filtering here keeps the
      // FlashList cell count aligned with the rendered count (important for
      // `masonry` layout).
      if (!isOnGoing(stake, now) && !isCompleted(stake, now)) return false

      const fullNodeId = (stake.nodeId ?? '').toLowerCase()
      const truncated = truncateNodeId(stake.nodeId ?? '').toLowerCase()
      const endDate = formatEndDate(stake.endTimestamp).toLowerCase()
      return (
        fullNodeId.includes(q) || truncated.includes(q) || endDate.includes(q)
      )
    })
  }, [stakes, trimmedQuery, hasQuery, now])

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

  const handleCancel = useCallback(async () => {
    // Wait for the keyboard to actually hide before navigating back. Calling
    // `Keyboard.dismiss()` and `back()` synchronously works on the simulator
    // but on a real Android device, when the results FlashList is mounted the
    // screen unmounts before the dismiss animation finishes and the keyboard
    // lingers. Awaiting `keyboardDidHide` (handled by dismissKeyboardIfNeeded)
    // ensures it's gone first. iOS resolves immediately.
    await dismissKeyboardIfNeeded()
    if (canGoBack()) back()
  }, [back, canGoBack])

  const handlePressStake = useCallback(
    async (txHash: string) => {
      // Dismiss the keyboard before navigating so it doesn't linger over (or
      // fight the layout of) the pushed detail screen. On Android this waits
      // for the keyboard to actually hide; on iOS it resolves immediately.
      await dismissKeyboardIfNeeded()
      // Push the detail onto this search modal's own stack (slides in over the
      // results) rather than opening the global /stakeDetail modal.
      navigate({ pathname: '/stakeSearch/stakeDetail', params: { txHash } })
    },
    [navigate]
  )

  const renderStakeCard = useStakeCardRenderer({
    now,
    motion,
    width: CARD_WIDTH,
    onPressStake: handlePressStake
  })

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PChainTransaction>): JSX.Element | null => {
      // FlashList's `masonry` layout can briefly invoke `renderItem` with an
      // `undefined` item when `data` shrinks between renders (e.g. while
      // typing into the SearchBar narrows `filteredStakes`). Guard so we
      // don't dereference an undefined stake before the next layout pass
      // catches up.
      if (!item) return null
      return (
        <Animated.View
          style={{
            marginBottom: 14,
            marginHorizontal: GRID_GAP / 2
          }}>
          {renderStakeCard(item)}
        </Animated.View>
      )
    },
    [renderStakeCard]
  )

  // Focus the SearchBar imperatively once the modal's enter transition has
  // settled instead of relying on the native `autoFocus` prop. On iOS form
  // sheets, autoFocus races the transition/keyboard and can drop focus or make
  // the keyboard bounce; the buffer lets layout settle first.
  useAfterScreenEnterTransition(() => searchBarRef.current?.focus(), {
    layoutBufferMs: FORM_SHEET_FOCUS_BUFFER_MS
  })

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })
    return () => {
      subscription.remove()
    }
  }, [])

  // While stakes haven't arrived yet keep the zero-state visible — the
  // "Find stakes by date or node ID" prompt is a benign fallback that avoids
  // misleading users with "No results found" before any real data is compared.
  const showZeroState = !hasQuery || !hasLoadedStakes
  const showResults = hasQuery && hasLoadedStakes && filteredStakes.length > 0
  const showNoResults =
    hasQuery && hasLoadedStakes && filteredStakes.length === 0

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
          // On Android, compensate for the parent modal layout's
          // `marginTop: -insets.top + 8` (see useModalScreensOptions). Without
          // this the SearchBar renders above the visible viewport even though
          // it still accepts input. iOS doesn't apply the negative marginTop
          // and the pageSheet already insets from the status bar.
          // Extra +12 leaves a visible gap below the Grabber (which sits at
          // top: 9 on iOS / top: insets.top - 2 on Android, height 5).
          paddingTop: Platform.OS === 'android' ? insets.top + 18 : 28,
          paddingBottom: 12
        }}>
        <View sx={{ flex: 1 }}>
          <SearchBar
            ref={searchBarRef}
            searchText={searchText}
            onTextChanged={setSearchText}
            placeholder="Search"
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
          title={'Find stakes by date\n(mm/dd/yyyy) or node ID'}
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

      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'android' ? insets.top - 2 : 9,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
        <Grabber />
      </View>

      {showResults && (
        <FlashList
          // Remount the list on every query change. FlashList's masonry layout
          // manager retains stale column heights across an in-place `data`
          // swap, so the top rows stay unpainted until a scroll forces a
          // layout recompute. Keying by the query gives each result set a
          // fresh layout (and resets scroll to the top, which is the desired
          // search UX).
          key={trimmedQuery}
          renderScrollComponent={RenderScrollComponent}
          data={filteredStakes}
          numColumns={2}
          masonry
          renderItem={renderItem}
          ListHeaderComponent={
            <View
              sx={{
                paddingTop: 4,
                paddingHorizontal: GRID_GAP / 2,
                paddingBottom: 16
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

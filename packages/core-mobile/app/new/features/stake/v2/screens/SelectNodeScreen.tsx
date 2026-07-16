import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Chip,
  Image,
  SearchBar,
  Text,
  View
} from '@avalabs/k2-alpine'
import { DropdownMenu } from 'common/components/DropdownMenu'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import { useRouter } from 'expo-router'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useNodes } from 'hooks/earn/useNodes'
import React, { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { getAvailableDelegationWeight } from 'services/earn/utils'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { NodeValidator } from 'types/earn'
import { useDelegateNodeSort } from '../hooks/useDelegateNodeSort'
import { DelegateNodeItem } from '../components/DelegateNodeItem'
import {
  countModifiedFilters,
  DelegateFilters,
  setDelegateNodeSelection,
  useDelegateFilters
} from '../store'
import {
  NodeWithAvailable,
  sortDelegateNodes
} from '../utils/sortDelegateNodes'

const SECONDS_PER_DAY = 24 * 60 * 60

/**
 * Applies the advanced filters to a validator. Each filter only narrows when
 * its toggle is on. `availableAvax` is the node's available delegation
 * capacity (in AVAX), precomputed by the caller.
 */
const passesAdvancedFilters = (
  v: NodeValidator,
  availableAvax: number,
  filters: DelegateFilters
): boolean => {
  if (filters.uptime.enabled && Number(v.uptime) < filters.uptime.min) {
    return false
  }
  if (
    filters.maxFee.enabled &&
    Number(v.delegationFee) > filters.maxFee.value
  ) {
    return false
  }
  if (
    filters.minAvailable.enabled &&
    availableAvax < filters.minAvailable.value
  ) {
    return false
  }
  if (filters.minTimeRemaining.enabled) {
    const remainingDays =
      (Number(v.endTime) - Date.now() / 1000) / SECONDS_PER_DAY
    if (remainingDays < filters.minTimeRemaining.value) {
      return false
    }
  }
  return true
}

const errorIcon = require('../../../../assets/icons/melting_face.png')

/**
 * V2 Delegate flow: the node picker shown when the user chooses "Delegate"
 * from the staking chooser. Unlike the V1 select-node screen — which runs
 * after amount + duration — this screen comes first. It opens pre-filtered
 * with core-web's default validator-search filters (uptime ≥ 75%, fee ≤ the
 * network minimum, remaining time ≥ the minimum stake duration; seeded in
 * `useStartStaking` via `applyDefaultDelegateFilters`) so both clients surface
 * the same nodes by default. The user can loosen those in Advanced filters,
 * and each node is tagged Recommended / Popular / Reliable / New (see
 * `determineNodeTags`).
 */
const SelectNodeScreen = (): JSX.Element => {
  const [searchText, setSearchText] = useState('')
  const sort = useDelegateNodeSort()
  const { navigate } = useRouter()
  const { isFetching, data, error } = useNodes()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { minStakeAmount } = useStakingParams()
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  // Depend on primitives (not the `networkToken` / `minStakeAmount` objects) so
  // the validator loop below doesn't re-run when those get new identities on
  // unrelated renders.
  const tokenDecimals = networkToken.decimals
  const tokenSymbol = networkToken.symbol
  const minStakeSubUnit = minStakeAmount.toSubUnit()
  const filters = useDelegateFilters(state => state.filters)
  const filterDefaults = useDelegateFilters(state => state.defaults)
  // Badge counts only filters the user has changed from the seeded defaults, so
  // the picker opens looking unfiltered even though the web-parity defaults are
  // applied.
  const activeFilterCount = countModifiedFilters(filters, filterDefaults)

  const validators = useMemo(() => {
    const all = data?.validators ?? []
    const query = searchText.trim().toLowerCase()
    const isSearching = query.length > 0

    const filtered: NodeWithAvailable[] = []
    for (const v of all) {
      if (isSearching && !v.nodeID.toLowerCase().includes(query)) continue

      // `available` is always computed — the rows and the "Most available"
      // sort need it even when the gates below are skipped.
      const available = getAvailableDelegationWeight({
        isDeveloperMode,
        validatorWeight: new TokenUnit(
          v.weight ?? 0,
          tokenDecimals,
          tokenSymbol
        ),
        delegatorWeight: new TokenUnit(
          v.delegatorWeight ?? 0,
          tokenDecimals,
          tokenSymbol
        )
      })

      // An explicit NodeID search bypasses every gate, mirroring core-web
      // ("Skip all other filters when searching by nodeIds",
      // `ValidatorSearchResults.tsx`) — otherwise searching a real node whose
      // fee/uptime falls outside the seeded defaults would confusingly return
      // no results.
      if (!isSearching) {
        // Hide nodes that can't accept at least the minimum delegation (full /
        // near-full validators), mirroring core-web's default
        // `minDelegationCapacity = minDelegatorStake` filter and the V1 select
        // screen. Node selection comes before amount entry here, so we gate on
        // the minimum rather than the (unknown) chosen amount.
        // `available >= minStakeAmount` (TokenUnit has no `gte`); compare in
        // sub-units (bigint) so the dep stays a primitive.
        if (available.toSubUnit() < minStakeSubUnit) continue

        // Advanced filters — each only narrows the list when its toggle is on.
        if (
          !passesAdvancedFilters(
            v,
            available.toDisplay({ asNumber: true }),
            filters
          )
        ) {
          continue
        }
      }

      filtered.push({ validator: v, available })
    }

    return sortDelegateNodes(filtered, sort.selected)
  }, [
    data?.validators,
    searchText,
    sort.selected,
    isDeveloperMode,
    minStakeSubUnit,
    tokenDecimals,
    tokenSymbol,
    filters
  ])

  const handlePressNode = useCallback(
    (node: NodeValidator): void => {
      const nodeIndex = validators.findIndex(
        v => v.validator.nodeID === node.nodeID
      )
      // Hand the currently-displayed (filtered + sorted) list and the tapped
      // index to the details screen so its header chevrons can page through
      // the same order.
      setDelegateNodeSelection(
        validators.map(v => v.validator),
        nodeIndex < 0 ? 0 : nodeIndex
      )
      navigate({ pathname: '/addStakeV2/delegate/nodeDetails' })
    },
    [validators, navigate]
  )

  const openAdvancedFilters = useCallback((): void => {
    navigate({ pathname: '/stakeAdvancedFilters' })
  }, [navigate])

  const renderItem = useCallback(
    ({ item }: { item: NodeWithAvailable }): JSX.Element => (
      <DelegateNodeItem
        node={item.validator}
        available={item.available}
        onPress={() => handlePressNode(item.validator)}
      />
    ),
    [handlePressNode]
  )

  const renderHeader = useCallback(
    () => (
      <View style={{ gap: 12 }}>
        <SearchBar
          searchText={searchText}
          onTextChanged={setSearchText}
          placeholder="Search by NodeID"
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}>
          <DropdownMenu
            groups={sort.data}
            onPressAction={(event: { nativeEvent: { event: string } }) =>
              sort.onSelected(event.nativeEvent.event)
            }>
            <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
              {sort.title}
            </Chip>
          </DropdownMenu>
          <Chip size="large" hitSlop={8} onPress={openAdvancedFilters}>
            Advanced filters
            {activeFilterCount > 0 ? (
              <Text variant="buttonSmall" sx={{ color: '$textSecondary' }}>
                {` ${activeFilterCount}`}
              </Text>
            ) : null}
          </Chip>
        </View>
      </View>
    ),
    [searchText, sort, activeFilterCount, openAdvancedFilters]
  )

  const renderEmpty = useCallback(() => {
    if (isFetching) {
      return (
        <View sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" />
        </View>
      )
    }

    // A non-empty search that matches nothing is a distinct case from the
    // initial load error / empty result — give it its own copy instead of
    // falling through to a blank screen. Trimmed to match the `validators`
    // memo, so whitespace-only input doesn't read as an active search.
    if (validators.length === 0 && searchText.trim().length > 0) {
      return (
        <ErrorState
          sx={{ flex: 1 }}
          icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
          title="No Matching Nodes"
          description="No node matches that NodeID. Try a different search."
        />
      )
    }

    if (error || validators.length === 0) {
      return (
        <ErrorState
          sx={{ flex: 1 }}
          icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
          title="We Couldn't Find a Match"
          description="Please start over or try again later."
        />
      )
    }
  }, [isFetching, error, validators.length, searchText])

  return (
    <ListScreen
      title={`Find and select your\npreferred node`}
      data={validators}
      renderItem={renderItem}
      isModal
      keyExtractor={item => item.validator.nodeID}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
    />
  )
}

export default SelectNodeScreen

import React, { useCallback, useState, useMemo } from 'react'
import {
  ActivityIndicator,
  Chip,
  Image,
  SafeAreaView,
  SearchBar,
  SimpleDropdown,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDelegationContext } from 'contexts/DelegationContext'
import { advancedFilterDropDownItems } from 'consts/earn'
import { NodeValidator } from 'types/earn'
import { useNodes } from 'hooks/earn/useNodes'
import { useAdvancedSearchNodes } from 'hooks/earn/useAdvancedSearchNodes'
import { secondsToMilliseconds } from 'date-fns'
import { UTCDate } from '@date-fns/utc'
import { NodeItem } from 'features/stake/components/NodeItem'
import { FlatList } from 'react-native'
import { useNodeSort } from 'features/stake/hooks/useNodeSort'
import { ErrorState } from 'common/components/ErrorState'

const errorIcon = require('../../../../assets/icons/melting_face.png')

const StakeSelectNode = (): JSX.Element => {
  const { navigate } = useRouter()

  const { stakeAmount } = useDelegationContext()
  const [searchText, setSearchText] = useState('')
  const { stakeEndTime, minUptime, maxDelegationFee } = useLocalSearchParams<{
    stakeEndTime: string
    minUptime: string
    maxDelegationFee: string
  }>()
  const stakingEndTime = useMemo(
    () => new UTCDate(secondsToMilliseconds(Number(stakeEndTime))),
    [stakeEndTime]
  )
  const sort = useNodeSort()
  const { isFetching, data, error } = useNodes()
  const { validators, error: useAdvancedSearchNodesError } =
    useAdvancedSearchNodes({
      validators: data?.validators,
      stakingAmount: stakeAmount,
      stakingEndTime,
      minUpTime: Number(minUptime),
      maxFee: Number(maxDelegationFee),
      sortFilter: advancedFilterDropDownItems[sort.selected.row]?.key,
      searchText
    })

  const handlePressNode = useCallback(
    (node: NodeValidator) => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/addStake/nodeDetails',
        params: { nodeId: node.nodeID, stakeEndTime }
      })
    },
    [navigate, stakeEndTime]
  )

  const renderItem = ({ item }: { item: NodeValidator }): JSX.Element => {
    return <NodeItem node={item} onPress={() => handlePressNode(item)} />
  }

  const sortButton = useMemo(
    () => (
      <SimpleDropdown
        from={
          <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
            Sort
          </Chip>
        }
        sections={sort.data}
        selectedRows={[sort.selected]}
        onSelectRow={sort.onSelected}
      />
    ),
    [sort]
  )

  if (isFetching) {
    return (
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (
    (error || useAdvancedSearchNodesError || validators?.length === 0) &&
    searchText.length === 0
  ) {
    return (
      <ErrorState
        sx={{ flex: 1 }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="We Couldn't Find a Match"
        description="Please start over or try again later."
      />
    )
  }

  return (
    <SafeAreaView sx={{ flex: 1 }}>
      <View sx={{ paddingHorizontal: 16, paddingBottom: 16, gap: 16 }}>
        <ScreenHeader title="Which node would you like to use?" />
        <SearchBar searchText={searchText} onTextChanged={setSearchText} />
      </View>
      <FlatList
        ListHeaderComponent={sortButton}
        data={validators}
        renderItem={renderItem}
        keyExtractor={item => item.nodeID}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          gap: 10
        }}
      />
    </SafeAreaView>
  )
}

export default StakeSelectNode

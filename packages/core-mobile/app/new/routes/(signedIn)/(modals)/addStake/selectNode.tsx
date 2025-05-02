import {
  ActivityIndicator,
  Chip,
  Image,
  SearchBar,
  SimpleDropdown,
  View
} from '@avalabs/k2-alpine'
import { UTCDate } from '@date-fns/utc'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import { advancedFilterDropDownItems } from 'consts/earn'
import { useDelegationContext } from 'contexts/DelegationContext'
import { secondsToMilliseconds } from 'date-fns'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { NodeItem } from 'features/stake/components/NodeItem'
import { useNodeSort } from 'features/stake/hooks/useNodeSort'
import { useAdvancedSearchNodes } from 'hooks/earn/useAdvancedSearchNodes'
import { useNodes } from 'hooks/earn/useNodes'
import React, { useCallback, useMemo, useState } from 'react'
import { NodeValidator } from 'types/earn'

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

  const renderHeader = useCallback(() => {
    return (
      <View style={{ gap: 12 }}>
        <SearchBar searchText={searchText} onTextChanged={setSearchText} />
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
      </View>
    )
  }, [searchText, setSearchText, sort])

  const renderEmpty = useCallback(() => {
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
  }, [isFetching, error, useAdvancedSearchNodesError, validators, searchText])

  return (
    <ListScreen
      title="Which node would you like to use?"
      data={validators ?? []}
      renderItem={renderItem}
      isModal
      keyExtractor={item => item.nodeID}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
    />
  )
}

export default StakeSelectNode

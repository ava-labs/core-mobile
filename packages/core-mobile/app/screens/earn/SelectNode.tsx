import React, { useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
import DropDown from 'components/Dropdown'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StakeSetupScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useRoute } from '@react-navigation/native'
import { NodeValidator, TAdvancedFilterDropDownItems } from 'types/earn'
import { useAdvancedSearchNodes } from 'hooks/earn/useAdvancedSearchNodes'
import { advancedFilterDropDownItems, UP_TIME_HIGH_TO_LOW } from 'consts/earn'
import Spinner from 'components/animation/Spinner'
import ZeroState from 'components/ZeroState'
import { useNodes } from 'hooks/earn/useNodes'
import { useDelegationContext } from 'contexts/DelegationContext'
import { NodeCard } from './components/NodeCard'
import { NoMatchFound } from './components/NoMatchFound'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.SelectNode
>

const SelectNode = (): JSX.Element => {
  const { stakeAmount } = useDelegationContext()
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] =
    useState<TAdvancedFilterDropDownItems>(UP_TIME_HIGH_TO_LOW)
  const { stakingEndTime, minUpTime, maxFee } =
    useRoute<ScreenProps['route']>().params

  const { isFetching, data, error } = useNodes()
  const { validators, error: useAdvancedSearchNodesError } =
    useAdvancedSearchNodes({
      validators: data?.validators,
      stakingAmount: stakeAmount,
      stakingEndTime,
      minUpTime,
      maxFee,
      sortFilter: filter.key,
      searchText
    })

  const handleSearch = (text: string): void => {
    setSearchText(text)
  }

  const selectedFilter = advancedFilterDropDownItems.findIndex(
    option => option === filter
  )

  const renderFilterOption = ({
    item
  }: {
    item: TAdvancedFilterDropDownItems
  }): JSX.Element => {
    return <OptionsRenderItem name={item.key} />
  }

  const renderSelectedFilterOption = (
    item: TAdvancedFilterDropDownItems
  ): JSX.Element => {
    return <SelectionRenderItem item={item} />
  }

  const renderItem = ({ item }: { item: NodeValidator }): JSX.Element => {
    return <NodeCard data={item} stakingEndTime={stakingEndTime} />
  }

  if (isFetching)
    return (
      <View style={styles.spinnerContainer}>
        <Spinner size={77} />
      </View>
    )

  if (
    (error || useAdvancedSearchNodesError || validators?.length === 0) &&
    searchText.length === 0
  ) {
    return <NoMatchFound />
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <AvaText.LargeTitleBold textStyle={{ marginBottom: 16 }}>
          Select Node
        </AvaText.LargeTitleBold>
        <>
          <View>
            <SearchBar
              placeholder="Search Node ID"
              onTextChanged={handleSearch}
              searchText={searchText}
            />
            <View style={styles.dropdownContainer}>
              <DropDown
                data={advancedFilterDropDownItems}
                alignment={'flex-end'}
                width={200}
                optionsRenderItem={renderFilterOption}
                selectedIndex={selectedFilter}
                selectionRenderItem={renderSelectedFilterOption}
                onItemSelected={selectedItem => setFilter(selectedItem)}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <FlatList
              style={styles.nodeList}
              data={validators}
              renderItem={renderItem}
              keyExtractor={item => item.nodeID}
              scrollEventThrottle={16}
              ItemSeparatorComponent={Separator}
              ListEmptyComponent={
                <ZeroState.NoResultsTextual
                  message={
                    'There are no nodes that match your search.  Please try again.'
                  }
                />
              }
            />
          </View>
        </>
      </View>
    </View>
  )
}

const Separator = (): JSX.Element => <Space y={16} />

const OptionsRenderItem = ({ name }: { name: string }): JSX.Element => {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <AvaText.Body1>{name}</AvaText.Body1>
    </View>
  )
}

const SelectionRenderItem = ({
  item
}: {
  item: TAdvancedFilterDropDownItems
}): JSX.Element => {
  const { theme } = useApplicationContext()
  return (
    <AvaText.ButtonSmall textStyle={{ color: theme.neutral50 }}>
      Sort by: {item.sortByTitle}
    </AvaText.ButtonSmall>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nodeList: {
    flex: 1,
    marginTop: 8
  },
  dropdownContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    marginVertical: 16
  }
})

export default SelectNode

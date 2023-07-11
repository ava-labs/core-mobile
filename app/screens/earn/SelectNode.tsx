import React, { useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
import { useNodes } from 'hooks/earn/useNodes'
import DropDown from 'components/Dropdown'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useRoute } from '@react-navigation/native'
import {
  AdvancedSortFilter,
  NodeValidator,
  TAdvancedFilterDropDownItems
} from 'types/earn.types'
import { useAdvancedSearchNodes } from 'hooks/earn/useAdvancedSearchNodes'
import { HIGH_TO_LOW, advancedFilterDropDownItems } from 'consts/earn.consts'
import { Spinner } from '../../../storybook/stories/Lotties.stories'
import { NodeCard } from './components/NodeCard'
import { NoMatchFound } from './components/NoMatchFound'

type NavigationProp = EarnScreenProps<typeof AppNavigation.Earn.SelectNode>

const SelectNode = () => {
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState<TAdvancedFilterDropDownItems>(
    advancedFilterDropDownItems[0] ?? {
      key: AdvancedSortFilter.UpTimeHighToLow,
      sortByTitle: HIGH_TO_LOW
    }
  )
  const { stakingAmount, stakingEndTime, minUpTime, maxFee } =
    useRoute<NavigationProp['route']>().params

  const { isFetching, data, error } = useNodes()
  const { validators, error: useAdvancedSearchNodesError } =
    useAdvancedSearchNodes({
      validators: data?.validators,
      stakingAmount,
      stakingEndTime,
      minUpTime,
      maxFee,
      sortFilter: filter.key,
      searchText
    })

  const handleSearch = (text: string) => {
    setSearchText(text)
  }

  const selectedFilter = advancedFilterDropDownItems.findIndex(
    option => option === filter
  )

  const renderFilterOption = ({
    item
  }: {
    item: TAdvancedFilterDropDownItems
  }) => {
    return <OptionsRenderItem name={item.key} />
  }

  const renderSelectedFilterOption = (item: TAdvancedFilterDropDownItems) => {
    return <SelectionRenderItem item={item} />
  }

  const renderItem = ({ item }: { item: NodeValidator }) => {
    return <NodeCard data={item} stakingAmount={stakingAmount} />
  }

  if (error || useAdvancedSearchNodesError || validators.length === 0)
    return <NoMatchFound />

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <AvaText.LargeTitleBold textStyle={{ marginBottom: 16 }}>
          Select Node
        </AvaText.LargeTitleBold>
        {isFetching ? (
          <View style={styles.spinnerContainer}>
            <Spinner size={77} />
          </View>
        ) : (
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
              />
            </View>
          </>
        )}
      </View>
    </View>
  )
}

const Separator = () => <Space y={16} />

const OptionsRenderItem = ({ name }: { name: string }) => {
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
}) => {
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

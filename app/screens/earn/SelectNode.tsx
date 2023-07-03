import React, { useMemo, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
import { useNodes } from 'hooks/query/useNodes'
import DropDown from 'components/Dropdown'
import { GetCurrentValidatorsResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/pvm'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Spinner } from '../../../storybook/stories/Lotties.stories'
import { NodeCard } from './components/NodeCard'

export type NodeValidator = GetCurrentValidatorsResponse['validators'][0] & {
  delegatorCount?: string
  delegatorWeight?: string
}

const SelectNode = () => {
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState(dropdownItems[0])

  const { isFetching, data } = useNodes()

  const handleSearch = (text: string) => {
    setSearchText(text)
  }

  const filteredNodes = useMemo<NodeValidator[] | undefined>(() => {
    return data?.validators.filter(
      node => node.nodeID.toLowerCase().search(searchText.toLowerCase()) !== -1
    )
  }, [data, searchText])

  const selectedFilter = dropdownItems.findIndex(
    option => option.name === filter?.name
  )

  const renderFilterOption = ({ item }: { item: { name: string } }) => {
    return <OptionsRenderItem name={item.name} />
  }

  const renderSelectedFilterOption = (item: { name: string }) => {
    return <SelectionRenderItem name={item.name} />
  }

  const renderItem = ({ item }: { item: NodeValidator }) => {
    return <NodeCard data={item} />
  }

  if (isFetching)
    return (
      <View style={styles.spinnerContainer}>
        <Spinner size={77} />
      </View>
    )

  return (
    <View style={styles.container}>
      <View>
        <AvaText.LargeTitleBold textStyle={{ marginBottom: 16 }}>
          Select Node
        </AvaText.LargeTitleBold>

        <SearchBar
          placeholder="Search Node ID"
          onTextChanged={handleSearch}
          searchText={searchText}
        />
        <View style={styles.dropdownContainer}>
          <DropDown
            data={dropdownItems}
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
          data={filteredNodes}
          renderItem={renderItem}
          keyExtractor={item => item.nodeID}
          scrollEventThrottle={16}
          ItemSeparatorComponent={Separator}
        />
      </View>
    </View>
  )
}

const dropdownItems = [
  { name: 'Uptime: High to Low' },
  {
    name: 'Uptime: Low to High'
  },
  {
    name: 'Fee: High to Low'
  },
  {
    name: 'Fee: Low to High'
  },
  {
    name: 'Duration: High to Low'
  },
  {
    name: 'Duration: Low to High'
  }
]

const Separator = () => <Space y={16} />

const OptionsRenderItem = ({ name }: { name: string }) => {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <AvaText.Body1>{name}</AvaText.Body1>
    </View>
  )
}

const SelectionRenderItem = ({ name }: { name: string }) => {
  const { theme } = useApplicationContext()
  return (
    <AvaText.ButtonSmall textStyle={{ color: theme.neutral50 }}>
      Filter: {name}
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
    alignItems: 'center'
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

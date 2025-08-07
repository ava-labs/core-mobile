import React, { useRef, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { Rect } from 'react-native-popover-view'
import { ScrollView, Text, View } from '../Primitives'
import { Button } from '../Button/Button'
import { showAlert } from '../Alert/Alert'
import { IndexPath, SimpleDropdown } from './SimpleDropdown'
import { usePopoverAnchor } from './usePopoverAnchor'

export default {
  title: 'Dropdown'
}

export const All = (): JSX.Element => {
  return (
    <ScrollView
      style={{
        width: '100%'
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginTop: 0, gap: 100 }}>
        <SingleSectionSingleSelectionDropdown />
        <SingleSectionMultipleSelectionDropdown />
        <MultipleSectionSingleSelectionDropdown />
        <MultipleSectionMultipleSelectionDropdown />
        <LeftAlignedDropdown />
        <RightAlignedDropdown />
        <SingleSectionSingleSelectionScrollableDropdown />
      </View>
    </ScrollView>
  )
}

const SingleSectionSingleSelectionDropdown = (): JSX.Element => {
  const sections = [
    ['All networks', 'Avalanche C-Chain', 'Bitcoin network', 'Ethereum']
  ]
  const [selectedRow, setSelectedRow] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  return (
    <View
      style={{
        gap: 12
      }}>
      <Text>Single section, Single selection</Text>
      <SimpleDropdown
        from={
          <Button type="primary" size="medium">
            {sections[selectedRow.section]?.[selectedRow.row]}
          </Button>
        }
        offset={10}
        sections={sections}
        selectedRows={[selectedRow]}
        onSelectRow={indexPath => setSelectedRow(indexPath)}
      />
    </View>
  )
}

const SingleSectionMultipleSelectionDropdown = (): JSX.Element => {
  const sections = [['Pictures', 'GIFs', 'Videos', 'Show hidden NFTs']]
  const [selectedRows, setSelectedRows] = useState<IndexPath[]>([
    { section: 0, row: 0 }
  ])

  return (
    <View
      style={{
        gap: 12
      }}>
      <Text>Single section, Multiple selections</Text>
      <SimpleDropdown
        from={
          <Button type="primary" size="medium">
            {selectedRows
              .map(indexPath => sections[indexPath.section]?.[indexPath.row])
              .join(', ')}
          </Button>
        }
        allowsMultipleSelection={true}
        offset={10}
        sections={sections}
        selectedRows={selectedRows}
        onSelectRow={indexPath => setSelectedRows([...selectedRows, indexPath])}
        onDeselectRow={indexPath =>
          setSelectedRows(
            selectedRows.filter(
              selectedRow =>
                selectedRow.section !== indexPath.section ||
                selectedRow.row !== indexPath.row
            )
          )
        }
      />
    </View>
  )
}

const MultipleSectionSingleSelectionDropdown = (): JSX.Element => {
  const sections = [['Highlights', 'Asset list'], ['Manage list']]
  const [selectedRow, setSelectedRow] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const handleSelectRow = (indexPath: IndexPath): void => {
    if (indexPath.section === 0) {
      setSelectedRow(indexPath)
    } else {
      showAlert({
        title: 'Manage list selected',
        buttons: [
          {
            text: 'OK'
          }
        ]
      })
    }
  }

  return (
    <View
      style={{
        gap: 12
      }}>
      <Text>Multiple sections, Single selection</Text>
      <SimpleDropdown
        from={
          <Button type="primary" size="medium">
            {sections[selectedRow.section]?.[selectedRow.row]}
          </Button>
        }
        offset={10}
        sections={sections}
        selectedRows={[selectedRow]}
        onSelectRow={handleSelectRow}
      />
    </View>
  )
}

const MultipleSectionMultipleSelectionDropdown = (): JSX.Element => {
  const sections = [
    ['Apple', 'Banana', 'Orange'],
    ['Cucumber', 'Eggplant']
  ]
  const [selectedRows, setSelectedRows] = useState<IndexPath[]>([
    { section: 0, row: 0 }
  ])

  return (
    <View
      style={{
        gap: 12
      }}>
      <Text>Multiple sections, Multiple selections</Text>
      <SimpleDropdown
        from={
          <Button type="primary" size="medium">
            {selectedRows
              .map(indexPath => sections[indexPath.section]?.[indexPath.row])
              .join(', ')}
          </Button>
        }
        allowsMultipleSelection={true}
        offset={10}
        sections={sections}
        selectedRows={selectedRows}
        onSelectRow={indexPath => setSelectedRows([...selectedRows, indexPath])}
        onDeselectRow={indexPath =>
          setSelectedRows(
            selectedRows.filter(
              selectedRow =>
                selectedRow.section !== indexPath.section ||
                selectedRow.row !== indexPath.row
            )
          )
        }
      />
    </View>
  )
}

const LeftAlignedDropdown = (): JSX.Element => {
  const sections = [
    ['All networks', 'Avalanche C-Chain', 'Bitcoin network', 'Ethereum']
  ]
  const [selectedRow, setSelectedRow] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const sourceRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null)

  const { anchorRect, isPopoverVisible, onShowPopover, onHidePopover } =
    usePopoverAnchor(sourceRef)

  return (
    <View
      style={{
        gap: 12
      }}>
      <Text>Left aligned</Text>
      <Button
        ref={sourceRef}
        type="primary"
        size="medium"
        onPress={onShowPopover}>
        {sections[selectedRow.section]?.[selectedRow.row]}
      </Button>
      <SimpleDropdown
        from={
          anchorRect
            ? new Rect(anchorRect.x, anchorRect.y, 0, anchorRect.height)
            : undefined
        }
        isVisible={isPopoverVisible}
        offset={10}
        sections={sections}
        selectedRows={[selectedRow]}
        onSelectRow={indexPath => setSelectedRow(indexPath)}
        onRequestClose={onHidePopover}
      />
    </View>
  )
}

const RightAlignedDropdown = (): JSX.Element => {
  const sections = [
    ['All networks', 'Avalanche C-Chain', 'Bitcoin network', 'Ethereum']
  ]
  const [selectedRow, setSelectedRow] = useState<IndexPath>({
    section: 0,
    row: 0
  })
  const sourceRef = useRef<React.ComponentRef<typeof TouchableOpacity>>(null)

  const { anchorRect, isPopoverVisible, onShowPopover, onHidePopover } =
    usePopoverAnchor(sourceRef)

  return (
    <View
      style={{
        gap: 12
      }}>
      <Text>Right aligned</Text>
      <Button
        ref={sourceRef}
        type="primary"
        size="medium"
        onPress={onShowPopover}>
        {sections[selectedRow.section]?.[selectedRow.row]}
      </Button>
      <SimpleDropdown
        from={
          anchorRect
            ? new Rect(anchorRect.width, anchorRect.y, 0, anchorRect.height)
            : undefined
        }
        isVisible={isPopoverVisible}
        offset={10}
        sections={sections}
        selectedRows={[selectedRow]}
        onSelectRow={indexPath => setSelectedRow(indexPath)}
        onRequestClose={onHidePopover}
      />
    </View>
  )
}

const SingleSectionSingleSelectionScrollableDropdown = (): JSX.Element => {
  const sections = [
    [
      'All networks',
      'Avalanche C-Chain',
      'Bitcoin network',
      'Ethereum',
      'Cardano',
      'Polkadot',
      'Chainlink',
      'Dogecoin',
      'Solana',
      'Polygon',
      'Uniswap'
    ]
  ]
  const [selectedRow, setSelectedRow] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  return (
    <View
      style={{
        gap: 12
      }}>
      <Text>Single section, Single selection</Text>
      <SimpleDropdown
        from={
          <Button type="primary" size="medium">
            {sections[selectedRow.section]?.[selectedRow.row]}
          </Button>
        }
        offset={10}
        sections={sections}
        selectedRows={[selectedRow]}
        onSelectRow={indexPath => setSelectedRow(indexPath)}
        scrollContentMaxHeight={200}
      />
    </View>
  )
}

import React, { useMemo, useRef, useState } from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  View
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import CarrotSVG from 'components/svg/CarrotSVG'
import { Popable, PopableManager } from 'react-native-popable'
import Separator from 'components/Separator'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import isString from 'lodash.isstring'
import { BlurView } from '@react-native-community/blur'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'

interface Props<ItemT> {
  data: ItemT[]
  selectionRenderItem: (selectedItem: ItemT) => string | React.ReactNode
  width: number
  alignment?: 'flex-start' | 'flex-end' | 'center'
  selectedIndex?: number
  optionsRenderItem?: (item: OptionsItemInfo<ItemT>) => React.ReactNode
  onItemSelected: (selectedItem: ItemT) => void
  disabled?: boolean
}

interface OptionsItemInfo<ItemT> {
  item: ItemT
}

/**
 * Pure component - NOT to be attached to any process such as Send, Swap, Bridge, etc.
 * Not the right tool for job because Popable doesnt calculate children size correctly and it cannot align Popover element
 * relative to selected item.
 *
 * @param data Array of options to be selected
 * @param selectionRenderItem Component to be rendered for selected option
 * @param selectedIndex Set which item from data shoul be selected
 * @param optionsRenderItem Render item for dropdown options
 * @param onItemSelected On selected option callback.
 * @param width Set this to max width of rendered items
 * @param alignment How should dropdown options be aligned relative to selected option.
 * @param disabled if set to true, dropdown won't show anything
 */
function DropDown<ItemT>({
  data,
  selectionRenderItem,
  selectedIndex = 0,
  optionsRenderItem,
  onItemSelected,
  width = 150,
  alignment = 'center',
  disabled
}: Props<ItemT>) {
  const theme = useApplicationContext().theme
  const ref = useRef<PopableManager>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const selectedItem = data.length ? data[selectedIndex] : undefined
  const selectionItem = selectedItem
    ? selectionRenderItem(selectedItem)
    : undefined

  /**
   * background to be used for items when its visible
   */
  const blurBackground = useMemo(() => {
    return Platform.OS === 'android' ? (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000000', opacity: 0.9 }
        ]}
      />
    ) : (
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={'light'}
        blurAmount={10}
        reducedTransparencyFallbackColor={'black'}
      />
    )
  }, [])

  /**
   * Used when no custom rendering is passed
   * @param item
   */
  const renderItem = (item: ListRenderItemInfo<ItemT>) => {
    return (
      <AvaButton.Base
        onPress={() => {
          onItemSelected(item.item)
          ref?.current?.hide()
          setIsFilterOpen(!isFilterOpen)
        }}>
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16
          }}>
          <AvaText.Body1 textStyle={{ paddingVertical: 8 }}>
            {item.item}
          </AvaText.Body1>
          {selectedItem === item.item && <CheckmarkSVG color={'white'} />}
        </Row>
      </AvaButton.Base>
    )
  }

  /**
   * Used when custom rendering is defined. Wrapped here with pressable
   * so to capture the manual dismissal of popable
   * @param item
   */
  const renderCustomItem = (item: ListRenderItemInfo<ItemT>) => {
    return (
      <Pressable
        onPress={() => {
          onItemSelected(item.item)
          ref?.current?.hide()
          setIsFilterOpen(!isFilterOpen)
        }}>
        {optionsRenderItem?.({
          item: item.item
        })}
      </Pressable>
    )
  }

  /**
   * List with content items
   */
  function filterContent() {
    return (
      <>
        {blurBackground}
        <FlatList
          data={data}
          renderItem={optionsRenderItem ? renderCustomItem : renderItem}
          ItemSeparatorComponent={Separator}
        />
      </>
    )
  }

  /**
   * Component that ties it all.
   * Content: content to be displayed and hidden.
   * OnAction: popable state listener
   * Children: tappable, always visible portion of component. Where user will tap to trigger
   * the items being displayed
   */
  return (
    <Popable
      ref={ref}
      content={disabled ? <View /> : filterContent()}
      action={'press'}
      onAction={setIsFilterOpen}
      position={'bottom'}
      style={{
        width: width,
        overflow: 'visible'
      }}
      wrapperStyle={{
        width: width,
        overflow: 'visible'
      }}
      caret={false}
      backgroundColor={theme.transparent}>
      <Row
        style={{
          justifyContent: alignment,
          alignItems: 'center'
        }}>
        {isString(selectionItem) ? (
          <AvaText.ButtonSmall
            textStyle={{ color: theme.colorText1, paddingEnd: 4 }}>
            {selectionItem}
          </AvaText.ButtonSmall>
        ) : (
          <>{selectionItem}</>
        )}
        {!disabled && (
          <>
            <Space x={4} />
            <CarrotSVG
              direction={isFilterOpen ? 'up' : 'down'}
              color={theme.colorText1}
            />
          </>
        )}
      </Row>
    </Popable>
  )
}

export default DropDown

import React, {FC, useMemo, useRef, useState} from 'react'
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'
import {useApplicationContext} from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import CarrotSVG from 'components/svg/CarrotSVG'
import {Popable, PopableManager} from 'react-native-popable'
import Separator from 'components/Separator'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import isString from 'lodash.isstring'
import {Space} from 'components/Space'
import {BlurView} from '@react-native-community/blur'

interface Props {
  filterItems: string[]
  title?: string
  currentItem: string | React.ReactNode
  onItemSelected?: (selectedItem: string) => void
  minWidth?: number
  style?: StyleProp<ViewStyle>
  customRenderItem?: (item: ListRenderItemInfo<string>) => React.ReactNode
}

/**
 * Pure component - NOT to be attached to any process such as Send, Swap, Bridge, etc.
 *
 * @param filterOptions Array of string items to be selected
 * @param title If not using icon, title of the filter
 * @param currentItem If not using icon, current filter selection
 * @param onItemSelected selection callback
 * @param minWidth minWidth of Popable
 * @param style Popable style
 */
const DropDown: FC<Props> = ({
  filterItems,
  title,
  currentItem,
  onItemSelected,
  minWidth = 150,
  style,
  customRenderItem
}) => {
  const theme = useApplicationContext().theme
  const ref = useRef<PopableManager>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  /**
   * background to be used for items when its visible
   */
  const blurBackground = useMemo(() => {
    return Platform.OS === 'android' ? (
      <View
        style={[
          StyleSheet.absoluteFill,
          {backgroundColor: '#000000', opacity: 0.9}
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
  const renderItem = (item: ListRenderItemInfo<string>) => {
    return (
      <View>
        <AvaText.Body1
          textStyle={{paddingVertical: 8}}
          onPress={() => {
            onItemSelected?.(item.item)
            ref?.current?.hide()
            setIsFilterOpen(!isFilterOpen)
          }}>
          {item.item}
        </AvaText.Body1>
        {currentItem === item.item && <CheckmarkSVG color={'white'} />}
      </View>
    )
  }

  /**
   * Used when custom rendering is defined. Wrapped here with pressable
   * so to capture the manual dismissal of popable
   * @param item
   */
  const renderCustomItem = (item: ListRenderItemInfo<string>) => {
    return (
      <Pressable
        onPress={() => {
          onItemSelected?.(item.item)
          ref?.current?.hide()
          setIsFilterOpen(!isFilterOpen)
        }}>
        {customRenderItem?.(item)}
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
          data={filterItems}
          renderItem={customRenderItem ? renderCustomItem : renderItem}
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
      content={filterContent()}
      action={'press'}
      onAction={setIsFilterOpen}
      position={'bottom'}
      style={[
        {
          minWidth: minWidth,
          marginTop: 0,
          left: -10
        },
        style
      ]}
      backgroundColor={theme.transparent}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
        {isString(currentItem) ? (
          <AvaText.ButtonSmall
            textStyle={{color: theme.colorText1, paddingEnd: 4}}>
            {title && title + ': '}
            {currentItem}
          </AvaText.ButtonSmall>
        ) : (
          <>{currentItem}</>
        )}
        <>
          <Space x={4} />
          <CarrotSVG
            direction={isFilterOpen ? 'up' : 'down'}
            color={theme.colorText1}
          />
        </>
      </View>
    </Popable>
  )
}

export default DropDown

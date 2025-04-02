import React, { useMemo, useRef, useState } from 'react'
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import CarrotSVG from 'components/svg/CarrotSVG'
import { Popable, PopableManager } from 'react-native-popable'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import isString from 'lodash.isstring'
import { BlurView } from 'expo-blur'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import Separator from 'components/Separator'
import { FlatList } from 'react-native'

const BORDER_RADIUS = 8
const BACKGROUND = '#252525'

interface Props<ItemT> {
  data: ItemT[]
  selectionRenderItem: (selectedItem: ItemT) => string | React.ReactNode
  width: number | 'auto'
  alignment?: 'flex-start' | 'flex-end' | 'center'
  selectedIndex?: number
  style?: StyleProp<ViewStyle>
  optionsRenderItem?: (item: OptionsItemInfo<ItemT>) => React.ReactNode
  onItemSelected: (selectedItem: ItemT) => void
  disabled?: boolean
  caretIcon?: React.ReactNode
  caretStyle?: StyleProp<ViewStyle>
  onDropDownToggle?: (isOpen: boolean) => void
  testID?: string
  prompt?: React.ReactNode
}

export interface OptionsItemInfo<ItemT> {
  item: ItemT
  testID?: string
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
 * @param style Extra style to pass to Popable
 * @param alignment How should dropdown options be aligned relative to selected option.
 * @param disabled if set to true, dropdown won't show anything
 * @param onDropDownToggle callback with dropdown open/close status
 */
function DropDown<ItemT>({
  data,
  selectionRenderItem,
  selectedIndex = 0,
  optionsRenderItem,
  onItemSelected,
  width = 150,
  style,
  alignment = 'center',
  disabled,
  caretIcon,
  caretStyle,
  onDropDownToggle,
  prompt
}: Props<ItemT>): JSX.Element {
  const theme = useApplicationContext().theme
  const ref = useRef<PopableManager>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const selectedItem = data.length ? data[selectedIndex] : undefined
  const selectionItem = selectedItem
    ? selectionRenderItem(selectedItem)
    : undefined

  const handleOnAction = (visible: boolean): void => {
    setIsFilterOpen(visible)
    onDropDownToggle?.(visible)
  }

  /**
   * background to be used for items when its visible
   */
  const blurBackground = useMemo(() => {
    return Platform.OS === 'android' ? (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: BACKGROUND, opacity: 0.95 }
        ]}
      />
    ) : (
      <>
        <BlurView
          style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS }]}
          tint={'dark'}
          intensity={75}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: BACKGROUND,
              opacity: 0.5,
              borderRadius: BORDER_RADIUS
            }
          ]}
        />
      </>
    )
  }, [])

  /**
   * Used when no custom rendering is passed
   * @param item
   */
  const renderItem = (item: ItemT): JSX.Element => {
    return (
      <AvaButton.Base
        onPress={() => {
          onItemSelected(item)
          ref?.current?.hide()
          setIsFilterOpen(!isFilterOpen)
        }}>
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16
          }}>
          <AvaText.Body1
            testID={`dropdown_item__${item}`}
            textStyle={{ paddingVertical: 8 }}>
            {item as JSX.Element}
          </AvaText.Body1>
          {selectedItem === item && (
            <CheckmarkSVG testID={`checked__${item}`} color={'white'} />
          )}
        </Row>
      </AvaButton.Base>
    )
  }

  /**
   * Used when custom rendering is defined. Wrapped here with pressable
   * so to capture the manual dismissal of popable
   * @param item
   */
  const renderCustomItem = (item: ItemT): JSX.Element => {
    return (
      <Pressable
        onPress={() => {
          onItemSelected(item)
          ref?.current?.hide()
          setIsFilterOpen(!isFilterOpen)
        }}>
        {optionsRenderItem?.({
          item: item
        })}
      </Pressable>
    )
  }

  /**
   * List with content items
   */
  const filterContent = (): JSX.Element => {
    return (
      <>
        {blurBackground}
        {data.length <= 6 ? (
          data.map((item, index) => {
            return (
              <View key={index}>
                {optionsRenderItem ? renderCustomItem(item) : renderItem(item)}
                {index < data.length - 1 && <Separator />}
              </View>
            )
          })
        ) : (
          <FlatList
            style={{ height: 270 }}
            data={data}
            renderItem={({ item }) =>
              optionsRenderItem ? renderCustomItem(item) : renderItem(item)
            }
            keyExtractor={(_, index) => index.toString()}
            ItemSeparatorComponent={Separator}
          />
        )}
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
      onAction={handleOnAction}
      position={'bottom'}
      style={[
        {
          width: width,
          borderRadius: BORDER_RADIUS,
          overflow: 'visible',
          top: 14
        },
        style
      ]}
      wrapperStyle={{
        width,
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
          <>{selectionItem ?? prompt}</>
        )}
        {!disabled && (
          <View style={[{ marginLeft: 8 }, caretStyle]}>
            {caretIcon ? (
              caretIcon
            ) : (
              <CarrotSVG
                direction={isFilterOpen ? 'up' : 'down'}
                color={theme.colorText1}
              />
            )}
          </View>
        )}
      </Row>
    </Popable>
  )
}

export default DropDown

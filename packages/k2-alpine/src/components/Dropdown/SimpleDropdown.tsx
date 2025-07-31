import React, { useCallback, useMemo, useRef } from 'react'
import Popover, { Rect } from 'react-native-popover-view'
import { Platform, StyleSheet } from 'react-native'
import { Text, View, TouchableOpacity, ScrollView } from '../Primitives'
import { useTheme } from '../../hooks'
import { Separator } from '../Separator/Separator'
import { Icons } from '../../theme/tokens/Icons'
import { DropdownBackground } from './DropdownBackground'

const groupSeparatorHeight = Platform.OS === 'ios' ? 6 : 1
const backgroundBorderRadius = Platform.OS === 'ios' ? 10 : 4

export const SimpleDropdown = <T extends { toString(): string }>({
  from,
  sections,
  selectedRows,
  offset = 0,
  allowsMultipleSelection = false,
  onSelectRow,
  onDeselectRow,
  onRequestClose,
  isVisible,
  minWidth = 200,
  displayArea,
  scrollContentMaxHeight
}: {
  from?: React.ReactNode | Rect
  sections: T[][]
  selectedRows: IndexPath[]
  allowsMultipleSelection?: boolean
  offset?: number
  onSelectRow: (indexPath: IndexPath) => void
  onDeselectRow?: (indexPath: IndexPath) => void
  onRequestClose?: () => void
  isVisible?: boolean
  minWidth?: number
  displayArea?: Pick<Rect, 'height' | 'width' | 'x' | 'y'>
  testID?: string
  scrollContentMaxHeight?: number
}): JSX.Element => {
  const { theme } = useTheme()
  const popoverRef = useRef<Popover>(null)

  const isSelected = useCallback(
    (indexPath: IndexPath): boolean => {
      return selectedRows.some(
        selectedRow =>
          selectedRow.section === indexPath.section &&
          selectedRow.row === indexPath.row
      )
    },
    [selectedRows]
  )

  const handlePress = useCallback(
    (indexPath: IndexPath): void => {
      if (isSelected(indexPath)) {
        onDeselectRow?.(indexPath)
      } else {
        onSelectRow(indexPath)
      }
      if (!allowsMultipleSelection) {
        popoverRef.current?.requestClose()
      }
    },
    [allowsMultipleSelection, onDeselectRow, onSelectRow, isSelected]
  )

  const popoverStyle = useMemo(
    () => [styles.popoverStyle, { minWidth }],
    [minWidth]
  )

  const content = useMemo(() => {
    return sections?.map((section, sectionIndex) => {
      return (
        <View key={sectionIndex}>
          {section.map((row, rowIndex) => {
            return (
              <View key={rowIndex}>
                <TouchableOpacity
                  onPress={() =>
                    handlePress({ section: sectionIndex, row: rowIndex })
                  }>
                  <View style={styles.section}>
                    <Text
                      sx={styles.sectionText}
                      testID={`dropdown_item__${row.toString()}`}>
                      {row.toString()}
                    </Text>
                    {isSelected({
                      section: sectionIndex,
                      row: rowIndex
                    }) && (
                      <Icons.Navigation.Check
                        color={theme.colors.$textPrimary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
                {rowIndex !== section.length - 1 && Platform.OS === 'ios' && (
                  <Separator />
                )}
              </View>
            )
          })}
          {sectionIndex !== sections.length - 1 && (
            <View
              sx={{
                height: groupSeparatorHeight,
                backgroundColor: theme.colors.$borderPrimary
              }}
            />
          )}
        </View>
      )
    })
  }, [
    sections,
    isSelected,
    handlePress,
    theme.colors.$borderPrimary,
    theme.colors.$textPrimary
  ])

  return (
    <View>
      <Popover
        ref={popoverRef}
        displayArea={displayArea}
        from={from}
        isVisible={isVisible}
        offset={offset}
        onRequestClose={onRequestClose}
        popoverStyle={popoverStyle}
        arrowSize={styles.arrow}
        backgroundStyle={{ backgroundColor: 'transparent' }}>
        <DropdownBackground>
          <ScrollView
            testID={`dropdown_scroll_view`}
            scrollEnabled={scrollContentMaxHeight !== undefined}
            showsVerticalScrollIndicator={false}
            sx={{
              maxHeight: scrollContentMaxHeight,
              backgroundColor: 'transparent'
            }}>
            {content}
          </ScrollView>
        </DropdownBackground>
      </Popover>
    </View>
  )
}

const styles = StyleSheet.create({
  popoverStyle: {
    borderRadius: backgroundBorderRadius,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 30,
    shadowOpacity: 0.5,
    backgroundColor: 'transparent',
    elevation: 4
  },
  arrow: {
    width: -10,
    height: 0
  },
  section: {
    paddingLeft: 18,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 40,
    fontFamily: 'Inter-Regular'
  }
})

export type IndexPath = {
  section: number
  row: number
}

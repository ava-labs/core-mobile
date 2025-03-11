import React, { useRef } from 'react'
import Popover, { Rect } from 'react-native-popover-view'
import { Platform } from 'react-native'
import { Text, View, TouchableOpacity } from '../Primitives'
import { useTheme } from '../../hooks'
import { Separator } from '../Separator/Separator'
import { Icons } from '../../theme/tokens/Icons'
import { DropdownBackground } from './DropdownBackground'

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
  displayArea
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
}): JSX.Element => {
  const { theme } = useTheme()
  const popoverRef = useRef<Popover>()

  const handlePress = (indexPath: IndexPath): void => {
    if (isSelected(indexPath)) {
      onDeselectRow?.(indexPath)
    } else {
      onSelectRow(indexPath)
    }
    if (!allowsMultipleSelection) {
      popoverRef.current?.requestClose()
    }
  }

  const isSelected = (indexPath: IndexPath): boolean => {
    return selectedRows.some(
      selectedRow =>
        selectedRow.section === indexPath.section &&
        selectedRow.row === indexPath.row
    )
  }

  const groupSeparatorHeight = Platform.OS === 'ios' ? 6 : 1
  const backgroundBorderRadius = Platform.OS === 'ios' ? 10 : 4

  return (
    <View>
      <Popover
        // @ts-expect-error
        ref={popoverRef}
        displayArea={displayArea}
        from={from}
        isVisible={isVisible}
        offset={offset}
        onRequestClose={onRequestClose}
        popoverStyle={{
          borderRadius: backgroundBorderRadius,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 30,
          shadowOpacity: 0.5,
          backgroundColor: 'transparent',
          elevation: 4,
          minWidth
        }}
        arrowSize={{ width: -10, height: 0 }}
        backgroundStyle={{ backgroundColor: 'transparent' }}>
        <DropdownBackground>
          {sections.map((section, sectionIndex) => {
            return (
              <View key={sectionIndex}>
                {section.map((row, rowIndex) => {
                  return (
                    <View key={rowIndex}>
                      <TouchableOpacity
                        onPress={() =>
                          handlePress({ section: sectionIndex, row: rowIndex })
                        }>
                        <View
                          style={{
                            paddingLeft: 18,
                            paddingRight: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: 40
                          }}>
                          <Text
                            sx={{
                              fontSize: 16,
                              lineHeight: 40,
                              fontFamily: 'Inter-Regular'
                            }}>
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
                      {rowIndex !== section.length - 1 &&
                        Platform.OS === 'ios' && <Separator />}
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
          })}
        </DropdownBackground>
      </Popover>
    </View>
  )
}

export type IndexPath = {
  section: number
  row: number
}

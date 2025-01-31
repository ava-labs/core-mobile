import React, { useRef } from 'react'
import Popover from 'react-native-popover-view'
import { BlurView } from 'expo-blur'
import { Text, View, TouchableOpacity } from '../Primitives'
import { useTheme } from '../../hooks'
import { Separator } from '../Separator/Separator'
import { Icons } from '../../theme/tokens/Icons'

export const SimpleDropdown = <T extends { toString(): string }>({
  from,
  sections,
  selectedRows,
  offset = 0,
  allowsMultipleSelection = false,
  onSelectRow,
  onDeselectRow
}: {
  from: React.ReactNode
  sections: T[][]
  selectedRows: IndexPath[]
  allowsMultipleSelection?: boolean
  offset?: number
  onSelectRow: (indexPath: IndexPath) => void
  onDeselectRow?: (indexPath: IndexPath) => void
}): JSX.Element => {
  const { theme } = useTheme()
  const popoverRef = useRef<Popover>()

  const handlePress = (indexPath: IndexPath): void => {
    if (allowsMultipleSelection) {
      if (isSelected(indexPath)) {
        onDeselectRow?.(indexPath)
      } else {
        onSelectRow(indexPath)
      }
    } else {
      onSelectRow(indexPath)

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

  return (
    <Popover
      // @ts-expect-error
      ref={popoverRef}
      from={from}
      offset={offset}
      popoverStyle={{
        borderRadius: 10,
        shadowOffset: { width: 0, height: 15 },
        shadowRadius: 30,
        shadowOpacity: 0.3,
        backgroundColor: 'transparent'
      }}
      arrowSize={{ width: -10, height: 0 }}
      backgroundStyle={{ backgroundColor: 'transparent' }}>
      <BlurView
        tint={'default'}
        style={{
          minWidth: 240
        }}
        intensity={100}
        experimentalBlurMethod="dimezisBlurView">
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
                    {rowIndex !== section.length - 1 && <Separator />}
                  </View>
                )
              })}
              {sectionIndex !== sections.length - 1 && (
                <View
                  sx={{
                    height: 6,
                    backgroundColor: theme.colors.$borderPrimary
                  }}
                />
              )}
            </View>
          )
        })}
      </BlurView>
    </Popover>
  )
}

export type IndexPath = {
  section: number
  row: number
}

import {
  Chip,
  IndexPath,
  SimpleDropdown,
  SxProp,
  usePopoverAnchor,
  View
} from '@avalabs/k2-alpine'
import { DropdownSelection } from 'common/types'
import React, { useRef } from 'react'
import { TouchableOpacity } from 'react-native'

const SEPARATOR_HEIGHT = 1
const POPOVER_HEIGHT = 40
const POPOVER_WIDTH = 250

interface Props {
  filter?: DropdownSelection & { selected: IndexPath | IndexPath[] }
  sort?: DropdownSelection
  view?: DropdownSelection
  sx?: SxProp
}

export const DropdownSelections = ({
  filter,
  sort,
  view,
  sx
}: Props): React.JSX.Element => {
  const sortRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null)

  const { anchorRect, isPopoverVisible, onShowPopover, onHidePopover } =
    usePopoverAnchor(sortRef)

  const renderSortOption = (): React.JSX.Element | undefined => {
    if (sort === undefined) return

    if (sort.useAnchorRect === true) {
      const numberOfItems = sort.data[0]?.length ?? 2
      const separatorHeight = (numberOfItems - 1) * SEPARATOR_HEIGHT
      const displayAreaHeight = numberOfItems * POPOVER_HEIGHT + separatorHeight

      return (
        <>
          <Chip
            ref={sortRef}
            size="large"
            hitSlop={8}
            rightIcon={'expandMore'}
            onPress={onShowPopover}>
            {sort.title}
          </Chip>
          <SimpleDropdown
            displayArea={
              anchorRect
                ? {
                    x: anchorRect.x,
                    y: anchorRect.y + anchorRect.height,
                    width: POPOVER_WIDTH,
                    height: displayAreaHeight
                  }
                : undefined
            }
            isVisible={isPopoverVisible}
            onRequestClose={onHidePopover}
            sections={sort.data}
            selectedRows={[sort.selected]}
            onSelectRow={sort.onSelected}
            minWidth={POPOVER_WIDTH}
          />
        </>
      )
    }

    return (
      <SimpleDropdown
        from={
          <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
            {sort.title}
          </Chip>
        }
        sections={sort.data}
        selectedRows={[sort.selected]}
        onSelectRow={sort.onSelected}
        minWidth={POPOVER_WIDTH}
      />
    )
  }

  return (
    <View
      sx={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        ...sx
      }}>
      <View sx={{ flexDirection: 'row', gap: 8 }}>
        {filter && (
          <SimpleDropdown
            from={
              <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
                {filter.title}
              </Chip>
            }
            sections={filter.data}
            selectedRows={
              Array.isArray(filter.selected)
                ? filter.selected
                : [filter.selected]
            }
            onSelectRow={filter.onSelected}
            onDeselectRow={filter.onDeselect}
            minWidth={POPOVER_WIDTH}
          />
        )}
        {renderSortOption()}
      </View>
      {view && (
        <SimpleDropdown
          from={
            <Chip size="large" hitSlop={8}>
              {view.title}
            </Chip>
          }
          sections={view.data}
          selectedRows={[view.selected]}
          onSelectRow={view.onSelected}
        />
      )}
    </View>
  )
}

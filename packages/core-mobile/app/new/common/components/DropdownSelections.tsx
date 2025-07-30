import {
  Chip,
  IndexPath,
  SimpleDropdown,
  SxProp,
  usePopoverAnchor,
  View
} from '@avalabs/k2-alpine'
import { DropdownSelection } from 'common/types'
import React, { memo, useMemo, useRef } from 'react'
import { NativeMethods } from 'react-native'

const SEPARATOR_HEIGHT = 1
const POPOVER_HEIGHT = 40
const POPOVER_WIDTH = 250

interface Props {
  filter?: DropdownSelection & { selected: IndexPath | IndexPath[] }
  sort?: DropdownSelection
  view?: DropdownSelection
  network?: DropdownSelection
  sx?: SxProp
}

export const DropdownSelections = ({
  filter,
  sort,
  network,
  view,
  sx
}: Props): React.JSX.Element => {
  const networkDropdown = useMemo(() => {
    if (!network) return

    return (
      <SimpleDropdown
        from={
          <Chip size="large" hitSlop={8} testID="network_dropdown_btn">
            {network.title}
          </Chip>
        }
        sections={network.data}
        selectedRows={[network.selected]}
        onSelectRow={network.onSelected}
      />
    )
  }, [network])

  const viewDropdown = useMemo(() => {
    if (!view) return

    return (
      <SimpleDropdown
        from={
          <Chip size="large" hitSlop={8} testID="view_dropdown_btn">
            {view.title}
          </Chip>
        }
        sections={view.data}
        selectedRows={[view.selected]}
        onSelectRow={view.onSelected}
      />
    )
  }, [view])

  return (
    <View
      sx={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        ...sx
      }}>
      <View sx={{ flexDirection: 'row', gap: 8 }}>
        {filter && (
          <Filters
            title={filter.title}
            data={filter.data}
            selected={filter.selected}
            onSelected={filter.onSelected}
            onDeselect={filter.onDeselect}
            scrollContentMaxHeight={filter.scrollContentMaxHeight}
          />
        )}

        {sort && (
          <Sorts
            useAnchorRect={sort.useAnchorRect}
            title={sort.title}
            data={sort.data}
            selected={sort.selected}
            onSelected={sort.onSelected}
          />
        )}
      </View>
      {viewDropdown}
      {networkDropdown}
    </View>
  )
}

const Filters = memo(
  ({
    title,
    data,
    selected,
    onSelected,
    onDeselect,
    scrollContentMaxHeight
  }: {
    title: DropdownSelection['title']
    data: DropdownSelection['data']
    selected: DropdownSelection['selected']
    onSelected: DropdownSelection['onSelected']
    onDeselect: DropdownSelection['onDeselect']
    scrollContentMaxHeight: DropdownSelection['scrollContentMaxHeight']
  }) => {
    const selectedRows = useMemo(
      () => (Array.isArray(selected) ? selected : [selected]),
      [selected]
    )

    const chip = useMemo(() => {
      return (
        <Chip
          size="large"
          hitSlop={8}
          rightIcon={'expandMore'}
          testID="filter_dropdown_btn">
          {title}
        </Chip>
      )
    }, [title])

    return (
      <SimpleDropdown
        from={chip}
        sections={data}
        selectedRows={selectedRows}
        onSelectRow={onSelected}
        onDeselectRow={onDeselect}
        minWidth={POPOVER_WIDTH}
        scrollContentMaxHeight={scrollContentMaxHeight}
      />
    )
  }
)

const Sorts = memo(
  ({
    useAnchorRect,
    title,
    data,
    selected,
    onSelected
  }: {
    useAnchorRect: DropdownSelection['useAnchorRect']
    title: DropdownSelection['title']
    data: DropdownSelection['data']
    selected: DropdownSelection['selected']
    onSelected: DropdownSelection['onSelected']
  }) => {
    const sortRef = useRef(null)

    const { anchorRect, isPopoverVisible, onShowPopover, onHidePopover } =
      usePopoverAnchor(sortRef as unknown as React.RefObject<NativeMethods>)

    const numberOfItems = data[0]?.length ?? 2

    const selectedRows = useMemo(() => {
      return [selected]
    }, [selected])

    const chip = useMemo(() => {
      if (!useAnchorRect) return null

      return (
        <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
          {title}
        </Chip>
      )
    }, [title, useAnchorRect])

    const displayArea = useMemo(() => {
      if (!anchorRect) return

      const separatorHeight = (numberOfItems - 1) * SEPARATOR_HEIGHT
      const displayAreaHeight = numberOfItems * POPOVER_HEIGHT + separatorHeight

      return {
        x: anchorRect.x,
        y: anchorRect.y + anchorRect.height,
        width: POPOVER_WIDTH,
        height: displayAreaHeight
      }
    }, [anchorRect, numberOfItems])

    if (useAnchorRect === true) {
      return (
        <>
          <Chip
            ref={sortRef}
            size="large"
            hitSlop={8}
            rightIcon={'expandMore'}
            onPress={onShowPopover}
            testID="sort_dropdown_btn">
            {title}
          </Chip>
          <SimpleDropdown
            displayArea={displayArea}
            isVisible={isPopoverVisible}
            onRequestClose={onHidePopover}
            sections={data}
            selectedRows={selectedRows}
            onSelectRow={onSelected}
            minWidth={POPOVER_WIDTH}
          />
        </>
      )
    }

    return (
      <SimpleDropdown
        from={chip}
        sections={data}
        selectedRows={selectedRows}
        onSelectRow={onSelected}
        minWidth={POPOVER_WIDTH}
      />
    )
  }
)

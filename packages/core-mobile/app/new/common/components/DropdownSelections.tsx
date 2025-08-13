import { Chip, SxProp, View } from '@avalabs/k2-alpine'
import { DropdownSelection } from 'common/types'
import React, { memo } from 'react'
import { DropdownMenu } from './DropdownMenu'

interface Props {
  filter?: DropdownSelection & { selected: string | string[] }
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
  return (
    <View
      sx={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        ...sx
      }}>
      <View sx={{ flexDirection: 'row', gap: 8 }}>
        {filter && (
          <Dropdown
            title={filter.title}
            data={filter.data}
            onSelected={filter.onSelected}
            testID="filter_dropdown_btn"
            rightIcon="expandMore"
          />
        )}

        {sort && (
          <Dropdown
            title={sort.title}
            data={sort.data}
            onSelected={sort.onSelected}
            testID="sort_dropdown_btn"
            rightIcon="expandMore"
          />
        )}
      </View>
      {view && (
        <Dropdown
          title={view.title}
          data={view.data}
          onSelected={view.onSelected}
          testID="view_dropdown_btn"
        />
      )}
      {network && (
        <Dropdown
          title={network.title}
          data={network.data}
          onSelected={network.onSelected}
          testID="network_dropdown_btn"
        />
      )}
    </View>
  )
}

const Dropdown = memo(
  ({
    title,
    data,
    onSelected,
    rightIcon,
    testID
  }: {
    title: DropdownSelection['title']
    data: DropdownSelection['data']
    onSelected: DropdownSelection['onSelected']
    rightIcon?: React.JSX.Element | 'expandMore'
    testID?: string
  }) => {
    // const numberOfItems = data[0]?.length ?? 2

    // const selectedRows = useMemo(() => {
    //   return [selected]
    // }, [selected])

    return (
      <DropdownMenu
        groups={data}
        onPressAction={(event: { nativeEvent: { event: string } }) =>
          onSelected(event.nativeEvent.event)
        }>
        <Chip size="large" hitSlop={8} rightIcon={rightIcon} testID={testID}>
          {title}
        </Chip>
      </DropdownMenu>
    )
  }
)

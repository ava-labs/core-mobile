import {
  Chip,
  IndexPath,
  SimpleDropdown,
  SxProp,
  View
} from '@avalabs/k2-alpine'
import React from 'react'

export type DropdownSelection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
}

interface Props {
  filter?: DropdownSelection
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
  return (
    <View
      sx={{
        marginTop: 19,
        marginBottom: 16,
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
            selectedRows={[filter.selected]}
            onSelectRow={filter.onSelected}
            minWidth={250}
          />
        )}
        {sort && (
          <SimpleDropdown
            from={
              <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
                {sort.title}
              </Chip>
            }
            sections={sort.data}
            selectedRows={[sort.selected]}
            onSelectRow={sort.onSelected}
            minWidth={250}
          />
        )}
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

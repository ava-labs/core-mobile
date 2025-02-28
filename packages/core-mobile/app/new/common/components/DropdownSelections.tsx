import {
  Button,
  getTintColor,
  Icons,
  IndexPath,
  SimpleDropdown,
  SxProp,
  useTheme,
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
  const { theme } = useTheme()
  const tintColor = getTintColor('secondary', theme, false)

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
              <Button
                size="small"
                type="secondary"
                hitSlop={8}
                rightIcon={
                  <Icons.Custom.ArrowDown
                    style={{ marginLeft: 5 }}
                    color={tintColor}
                  />
                }>
                {filter.title}
              </Button>
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
              <Button
                size="small"
                type="secondary"
                hitSlop={8}
                rightIcon={
                  <Icons.Custom.ArrowDown
                    style={{ marginLeft: 5 }}
                    color={tintColor}
                  />
                }>
                {sort.title}
              </Button>
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
            <Button size="small" type="secondary" hitSlop={8}>
              {view.title}
            </Button>
          }
          sections={view.data}
          selectedRows={[view.selected]}
          onSelectRow={view.onSelected}
        />
      )}
    </View>
  )
}

import {
  Button,
  getTintColor,
  Icons,
  IndexPath,
  SimpleDropdown,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { DropdownSelection } from 'common/types'
import React from 'react'

interface Props {
  filter: DropdownSelection
  sort: DropdownSelection
  view: DropdownSelection
}

export const AssetsHeader = ({
  filter,
  sort,
  view
}: Props): React.JSX.Element => {
  const { theme } = useTheme()
  const tintColor = getTintColor('secondary', theme, false)

  return (
    <View
      sx={{
        justifyContent: 'space-between',
        flexDirection: 'row'
      }}>
      <View sx={{ flexDirection: 'row', gap: 8 }}>
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
          selectedRows={
            filter.selected instanceof Array
              ? (filter.selected as IndexPath[])
              : [filter.selected]
          }
          onSelectRow={filter.onSelected}
          onDeselectRow={filter.onDeselect}
          minWidth={250}
        />

        <View>
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
            selectedRows={[sort.selected as IndexPath]}
            onSelectRow={sort.onSelected}
            minWidth={250}
          />
        </View>
      </View>
      <SimpleDropdown
        from={
          <Button size="small" type="secondary" hitSlop={8}>
            {view.title}
          </Button>
        }
        sections={view.data}
        selectedRows={[view.selected as IndexPath]}
        onSelectRow={view.onSelected}
      />
    </View>
  )
}

import {
  Button,
  getTintColor,
  Icons,
  SimpleDropdown,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { Selection } from '../hooks/useFilterAndSort'

interface Props {
  filter: Selection
  sort: Selection
  view: Selection
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
          selectedRows={[filter.selected]}
          onSelectRow={filter.onSelected}
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
            selectedRows={[sort.selected]}
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
        selectedRows={[view.selected]}
        onSelectRow={view.onSelected}
      />
    </View>
  )
}

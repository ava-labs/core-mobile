import {
  Button,
  getTintColor,
  Icons,
  SimpleDropdown,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { Selection } from './assets/useFilterAndSort'

interface Props {
  filter: Selection
  sort: Selection
  view: Selection
}

export const ListFilterHeader = ({
  filter,
  sort,
  view
}: Props): React.JSX.Element => {
  const { theme } = useTheme()
  const tintColor = getTintColor('secondary', theme, false)

  return (
    <View
      sx={{
        marginTop: 19,
        marginBottom: 16,
        justifyContent: 'space-between',
        flexDirection: 'row'
      }}>
      <View sx={{ flexDirection: 'row', gap: 8 }}>
        <SimpleDropdown
          from={
            <Button
              size="small"
              type="secondary"
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
        />

        <SimpleDropdown
          from={
            <Button
              size="small"
              type="secondary"
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
        />
      </View>
      <SimpleDropdown
        from={
          <Button size="small" type="secondary">
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

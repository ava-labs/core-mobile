import {
  Button,
  getTintColor,
  Icons,
  SimpleDropdown,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { Rect } from 'react-native-popover-view'
import { Platform } from 'react-native'
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

  // Android needs to add the height of the anchorRect to the y position
  // to make the popover appear below the Button
  const rect = sort.anchorRect
    ? new Rect(
        sort.anchorRect.width + sort.anchorRect.x + 16,
        Platform.OS === 'ios'
          ? sort.anchorRect.y
          : sort.anchorRect.y + sort.anchorRect.height,
        sort.anchorRect.width,
        sort.anchorRect.height
      )
    : undefined

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
          minWidth={250}
        />

        <View>
          <Button
            ref={sort.ref}
            size="small"
            type="secondary"
            onPress={sort.onShowPopover}
            rightIcon={
              <Icons.Custom.ArrowDown
                style={{ marginLeft: 5 }}
                color={tintColor}
              />
            }>
            {sort.title}
          </Button>
          <SimpleDropdown
            from={rect}
            sections={sort.data}
            isVisible={sort.isPopoverVisible}
            onRequestClose={sort.onHidePopover}
            selectedRows={[sort.selected]}
            onSelectRow={sort.onSelected}
            minWidth={250}
          />
        </View>
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

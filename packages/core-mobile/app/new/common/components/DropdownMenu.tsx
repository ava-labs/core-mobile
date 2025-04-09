import { Icons, Text, useTheme } from '@avalabs/k2-alpine'
import React, { CSSProperties, useCallback } from 'react'
import { Pressable } from 'react-native'
import {
  CheckboxItem,
  Content,
  create,
  Group,
  Item,
  ItemIcon,
  ItemImage,
  ItemIndicator,
  ItemTitle,
  Root,
  Trigger
} from 'zeego/dropdown-menu'

export interface DropdownItem {
  id: string
  title: string
  selected?: boolean
  icon?: {
    ios: string
    android: string
  }
  disabled?: boolean
  destructive?: boolean
}

export interface DropdownGroup
  extends Omit<React.ComponentProps<typeof Group>, 'children'> {
  items: DropdownItem[]
}

interface DropdownMenuProps extends React.ComponentProps<typeof Root> {
  children: React.ReactNode
  groups: DropdownGroup[]
  style?: CSSProperties
  onPressAction: (event: { nativeEvent: { event: string } }) => void
}

export function DropdownMenu({
  groups,
  style,
  children,
  onPressAction,
  ...props
}: DropdownMenuProps): React.ReactNode {
  const { theme } = useTheme()
  const renderItem = useCallback(
    ({ title, id, icon, selected, ...rest }: DropdownItem) => {
      if (selected) {
        return (
          <DropdownMenuCheckboxItem
            {...rest}
            value={selected ? 'on' : 'off'}
            onSelect={() => onPressAction({ nativeEvent: { event: id } })}
            key={id}>
            <DropdownMenuItemIndicator />
            <DropdownMenuItemTitle>{title}</DropdownMenuItemTitle>
          </DropdownMenuCheckboxItem>
        )
      }

      return (
        <DropdownMenuItem
          {...rest}
          key={id}
          onSelect={() => onPressAction({ nativeEvent: { event: id } })}>
          {icon && (
            <DropdownMenuItemIcon
              androidIconName={icon?.android}
              ios={{
                name: icon?.ios as any,
                paletteColors: [
                  {
                    dark: rest.destructive
                      ? theme.colors?.$textDanger
                      : theme.colors?.$textPrimary,
                    light: rest.destructive
                      ? theme.colors?.$textDanger
                      : theme.colors?.$textPrimary
                  }
                ]
              }}
            />
          )}
          <DropdownMenuItemTitle
            color={
              rest.destructive
                ? theme.colors?.$textDanger
                : theme.colors?.$textPrimary
            }>
            {title}
          </DropdownMenuItemTitle>
          {/* <DropdownMenuImage
            source={require('../../assets/icons/rocket.png')}
            height={24}
            width={24}
          /> */}
        </DropdownMenuItem>
      )
    },
    [onPressAction, theme.colors?.$textDanger, theme.colors.$textPrimary]
  )

  const renderContent = useCallback(() => {
    return groups?.map(group => (
      <DropdownMenuGroup {...group} key={group.id}>
        {group.items.map(renderItem)}
      </DropdownMenuGroup>
    ))
  }, [renderItem, groups])

  return (
    <Root {...props}>
      <Content>{renderContent()}</Content>
      <DropdownMenuTrigger style={style}>
        {children ?? <Text>Dropdown</Text>}
      </DropdownMenuTrigger>
    </Root>
  )
}

const DropdownMenuTrigger = create(
  (props: React.ComponentProps<typeof Trigger>) => (
    <Trigger {...props} asChild>
      <Pressable>{props.children}</Pressable>
    </Trigger>
  ),
  'Trigger'
)
const DropdownMenuItem = create(
  (props: React.ComponentProps<typeof Item>) => (
    <Item {...props} style={{ height: 34 }} />
  ),
  'Item'
)
const DropdownMenuItemTitle = create(
  (props: React.ComponentProps<typeof ItemTitle>) => <ItemTitle {...props} />,
  'ItemTitle'
)
const DropdownMenuItemIcon = create(
  (props: React.ComponentProps<typeof ItemIcon>) => <ItemIcon {...props} />,
  'ItemIcon'
)
const DropdownMenuGroup = create(
  (props: React.ComponentProps<typeof Group>) => <Group {...props} />,
  'Group'
)

const DropdownMenuCheckboxItem = create(
  (props: React.ComponentProps<typeof CheckboxItem>) => (
    <CheckboxItem
      {...props}
      style={{ ...props.style, display: 'flex', alignItems: 'center', gap: 8 }}>
      <ItemIndicator />
    </CheckboxItem>
  ),
  'CheckboxItem'
)

const DropdownMenuItemIndicator = create(
  (props: React.ComponentProps<typeof ItemIndicator>) => (
    <ItemIndicator {...props} />
  ),
  'ItemIndicator'
)

const DropdownMenuImage = create(
  (props: React.ComponentProps<typeof ItemImage>) => <ItemImage {...props} />,
  'ItemImage'
)

import { Text, useTheme } from '@avalabs/k2-alpine'
import React, { CSSProperties, useCallback } from 'react'
import { Platform } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
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
  Separator,
  Trigger
} from 'zeego/dropdown-menu'
import { DropdownMenuIcon, getPlatformIcons } from './DropdownMenuIcons'

export interface DropdownItem {
  id: string
  title: string
  selected?: boolean
  icon?: DropdownMenuIcon
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
  disabled?: boolean
  onPressAction: (event: { nativeEvent: { event: string } }) => void
  triggerAction?: 'press' | 'longPress'
}

export function DropdownMenu({
  groups,
  style,
  children,
  disabled,
  onPressAction,
  triggerAction = 'press',
  ...props
}: DropdownMenuProps): React.ReactNode {
  const { theme } = useTheme()

  const renderItem = useCallback(
    ({ title, id, icon, selected, ...rest }: DropdownItem) => {
      const platformIcon = getPlatformIcons(icon, theme?.isDark, {
        disabled: rest.disabled,
        destructive: rest.destructive
      })

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
          <DropdownMenuItemTitle
            color={
              rest.destructive
                ? theme.colors?.$textDanger
                : theme.colors?.$textPrimary
            }>
            {title}
          </DropdownMenuItemTitle>

          {/* 
            Android uses drawable resources for icons (SVGs saved as .xml files)
            iOS uses PNGs for disabled/light/dark on each icon (saved in assets/icons/menu/)
          */}
          {Platform.select({
            ios: platformIcon?.ios ? (
              <DropdownMenuImage source={platformIcon.ios} />
            ) : null,
            android: platformIcon?.android ? (
              <DropdownMenuItemIcon androidIconName={platformIcon.android} />
            ) : null
          })}
        </DropdownMenuItem>
      )
    },
    [
      onPressAction,
      theme.colors?.$textDanger,
      theme.colors?.$textPrimary,
      theme.isDark
    ]
  )

  return (
    <Root {...props}>
      <DropdownMenuTrigger
        disabled={disabled}
        style={style}
        action={triggerAction}>
        {children ?? <Text>Dropdown</Text>}
      </DropdownMenuTrigger>

      <Content key="dropdown-content">
        {groups?.map(group => (
          <DropdownMenuGroup {...group} key={group.key}>
            {group.items.map(renderItem)}
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        ))}
      </Content>
    </Root>
  )
}

const DropdownMenuTrigger = create(
  (
    props: React.ComponentProps<typeof Trigger> & {
      action?: 'press' | 'longPress'
    }
  ) => <Trigger {...props}>{props.children}</Trigger>,
  'Trigger'
)
const DropdownMenuItem = create(
  (props: React.ComponentProps<typeof Item>) => (
    <Item {...props}>
      <Pressable>{props.children}</Pressable>
    </Item>
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

const DropdownMenuSeparator = create(
  (props: React.ComponentProps<typeof Separator>) => (
    <Separator
      style={{
        height: 10
      }}
      {...props}
    />
  ),
  'Separator'
)

const DropdownMenuCheckboxItem = create(
  (props: React.ComponentProps<typeof CheckboxItem>) => (
    <CheckboxItem
      {...props}
      style={{ ...props.style, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Pressable>
        <ItemIndicator />
        {props.children}
      </Pressable>
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

import React, { type ReactNode } from 'react'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { Button } from '../Button/Button'
import { ActivityIndicator, Text, View } from '../Primitives'

export interface ChecklistItem {
  /** Title shown at the top of the row. */
  readonly title: string
  /** Supporting copy shown beneath the title. */
  readonly description: string
  /**
   * When `true`, the row's action button is replaced by the completion icon
   * (defaults to `Icons.Action.CheckCircle` in `$textSuccess`).
   */
  readonly done: boolean
  /** Label of the action button while the item is pending. */
  readonly actionLabel: string
  /** Press handler for the action button. */
  readonly onAction: () => void
  /**
   * Disable the action button without marking the item complete. Used to gate
   * later steps on earlier ones (e.g. step 2 unlocks once step 1 is `done`).
   */
  readonly actionDisabled?: boolean
  /** Show a spinner in place of the action label while the action is running. */
  readonly loading?: boolean
  /** Optional `testID` for the pending-state action button. */
  readonly actionTestId?: string
}

export interface ChecklistProps {
  /** Items rendered top-down. */
  readonly items: readonly ChecklistItem[]
  /** Override the icon shown when an item is `done`. */
  readonly completedIcon?: ReactNode
}

/**
 * Vertical list of completable items — each a card with a title, description,
 * and a trailing action button or completion icon. Designed for one-time setup
 * flows (e.g. the perps "Set up trading account" panel) where each item maps to
 * a single user-driven action, with later steps optionally gated on earlier
 * ones via `actionDisabled`.
 */
export const Checklist = ({
  items,
  completedIcon
}: ChecklistProps): JSX.Element => (
  <View sx={{ gap: 12 }}>
    {items.map((item, index) => (
      <ChecklistRow
        key={`${index}-${item.title}`}
        item={item}
        completedIcon={completedIcon}
      />
    ))}
  </View>
)

const ChecklistRow = ({
  item,
  completedIcon
}: {
  item: ChecklistItem
  completedIcon?: ReactNode
}): JSX.Element => {
  const { theme } = useTheme()
  const {
    title,
    description,
    done,
    actionLabel,
    onAction,
    actionDisabled = false,
    loading = false,
    actionTestId
  } = item

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        padding: 16
      }}>
      <View sx={{ flex: 1, gap: 2 }}>
        <Text variant="body1" sx={{ fontFamily: 'Inter-Medium' }}>
          {title}
        </Text>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          {description}
        </Text>
      </View>
      {done ? (
        completedIcon ?? (
          <Icons.Action.CheckCircle
            width={28}
            height={28}
            color={theme.colors.$textSuccess}
          />
        )
      ) : (
        <Button
          type="secondary"
          size="small"
          disabled={actionDisabled}
          onPress={onAction}
          testID={actionTestId}>
          {loading ? <ActivityIndicator size="small" /> : actionLabel}
        </Button>
      )}
    </View>
  )
}

import { SquareButton, SquareButtonIconType } from '@avalabs/k2-alpine'
import React, { useCallback } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import {
  useIsActiveWalletKeystoneDeprecated,
  useKeystoneDeprecation
} from 'features/keystone/hooks/useKeystoneDeprecation'
import { ActionButtonTitle } from '../consts'

/**
 * Actions that end in a signature, which a Keystone wallet can no longer
 * produce. Buy, Receive and Hide/Unhide are excluded because they still work.
 */
const SIGNING_ACTIONS: readonly ActionButtonTitle[] = [
  ActionButtonTitle.Send,
  ActionButtonTitle.Swap,
  ActionButtonTitle.Stake,
  ActionButtonTitle.Bridge,
  ActionButtonTitle.Withdraw
]

export const ActionButtons = ({
  buttons,
  contentContainerStyle
}: {
  buttons: ActionButton[]
  contentContainerStyle?: StyleProp<ViewStyle>
}): JSX.Element => {
  const isKeystoneDeprecated = useIsActiveWalletKeystoneDeprecated()
  const { openDeprecationInfo } = useKeystoneDeprecation()

  // Explain up front rather than letting a Keystone user pick a recipient,
  // enter an amount and wait on a fee quote for a transaction that can only
  // fail at the signing step. The buttons stay enabled: a disabled button
  // would swallow the tap and explain nothing.
  const resolveOnPress = useCallback(
    (item: ActionButton): (() => void) =>
      isKeystoneDeprecated && SIGNING_ACTIONS.includes(item.title)
        ? openDeprecationInfo
        : item.onPress,
    [isKeystoneDeprecated, openDeprecationInfo]
  )

  // NOTE: We intentionally render each button WITHOUT a reanimated `entering`
  // animation. The previous staggered `FadeInRight(...).springify()` entrance
  // could be left stuck at intermediate values (semi-transparent and/or
  // translated/pushed) when the animation was interrupted by a re-mount —
  // ActionButtons is conditionally mounted via `filteredTokenList.length > 0`
  // and re-mounts during balance refetch / account switch / scroll. Springified
  // entering animations are especially prone to this on the New Architecture
  // (Fabric), where an interrupted entering animation isn't finalized to its
  // resting value. Rendering the buttons statically guarantees they are always
  // fully opaque and in their resting position.
  const renderActionItem = (item: ActionButton): JSX.Element => {
    return (
      <SquareButton
        testID={`action_button__${item.title}`}
        title={item.title}
        icon={item.icon}
        onPress={resolveOnPress(item)}
        disabled={item.disabled}
      />
    )
  }

  return (
    <Animated.FlatList
      style={{ overflow: 'visible' }}
      contentContainerStyle={[{ gap: 10 }, contentContainerStyle]}
      horizontal
      scrollEventThrottle={16}
      data={buttons}
      renderItem={item => renderActionItem(item.item)}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, index) => index.toString()}
    />
  )
}

export type ActionButton = {
  title: ActionButtonTitle
  icon: SquareButtonIconType
  disabled?: boolean
  onPress: () => void
}

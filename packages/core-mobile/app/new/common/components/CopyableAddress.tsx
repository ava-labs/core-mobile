import { Pressable, Text } from '@avalabs/k2-alpine'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { copyToClipboard } from 'common/utils/clipboard'
import React from 'react'

type CopyableAddressProps = Omit<
  React.ComponentProps<typeof Text>,
  'children'
> & {
  address: string
  /** Leading characters kept; the trailing chunk is always half of it. */
  visibleChars?: number
  copiedMessage?: string
  testID?: string
}

/**
 * Renders a shortened address that can still be recovered in full.
 *
 * `truncateAddress` returns a shortened *string*, so the characters it drops
 * are not in the view at all — there is nothing to select, expand or inspect.
 * Anywhere we show one, a tap has to hand back the full value, otherwise the
 * user is asked to check an address they cannot actually read. This mirrors
 * what the approval screens already do in `features/approval/components`.
 */
export const CopyableAddress = ({
  address,
  visibleChars = TRUNCATE_ADDRESS_LENGTH,
  copiedMessage = 'Address copied',
  testID,
  ...textProps
}: CopyableAddressProps): JSX.Element => (
  <Pressable
    testID={testID}
    onPress={() => copyToClipboard(address, copiedMessage)}>
    <Text variant="mono" numberOfLines={1} {...textProps}>
      {truncateAddress(address, visibleChars)}
    </Text>
  </Pressable>
)

import React, { useCallback } from 'react'
import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { getAddressExplorerUrl } from '../utils/getAddressExplorerUrl'

/**
 * Explicit "view in block explorer" button rendered next to an address on the
 * approval screen, so the user can independently verify recipients, contracts
 * and spenders before signing (WSR-VERI-002). Renders nothing when the network
 * has no usable explorer URL.
 */
export const ExplorerLinkButton = ({
  address,
  explorerUrl
}: {
  address: string
  explorerUrl?: string
}): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const { openUrl } = useInAppBrowser()
  const url = getAddressExplorerUrl(explorerUrl, address)

  const handlePress = useCallback(() => {
    if (url) openUrl(url)
  }, [openUrl, url])

  if (!url) return null

  return (
    <TouchableOpacity
      testID={`explorer_link__${address}`}
      accessibilityRole="link"
      accessibilityLabel="View in explorer"
      hitSlop={12}
      onPress={handlePress}
      style={{ marginLeft: 8 }}>
      <Icons.Custom.Outbound
        width={18}
        height={18}
        color={colors.$textSecondary}
      />
    </TouchableOpacity>
  )
}

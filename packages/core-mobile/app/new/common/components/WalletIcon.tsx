import { Icons, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { WalletType } from 'services/wallet/types'
import { Wallet } from 'store/wallet/types'

export const WalletIcon = ({
  wallet,
  isExpanded,
  width = 24,
  height = 24,
  color
}: {
  wallet: Wallet
  width?: number
  height?: number
  isExpanded?: boolean
  color?: string
}): JSX.Element => {
  const { theme } = useTheme()
  if (
    wallet?.type === WalletType.LEDGER ||
    wallet?.type === WalletType.LEDGER_LIVE
  ) {
    return (
      <Icons.Custom.Ledger
        color={color || theme.colors.$textPrimary}
        width={width}
        height={height}
      />
    )
  }
  if (isExpanded) {
    return (
      <Icons.Custom.Wallet
        color={color || theme.colors.$textPrimary}
        width={width}
        height={height}
      />
    )
  }
  return (
    <Icons.Custom.WalletClosed
      color={color || theme.colors.$textPrimary}
      width={width}
      height={height}
    />
  )
}

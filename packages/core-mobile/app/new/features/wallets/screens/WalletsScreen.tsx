import { useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { WalletList } from '../components/WalletList'

const WalletsScreen = (): JSX.Element => {
  const { theme } = useTheme()
  return (
    <WalletList
      title="My wallets"
      subtitle={`An overview of your wallets\nand associated accounts`}
      backgroundColor={theme.isDark ? '#121213' : '#F1F1F4'}
      style={{
        backgroundColor: theme.isDark ? '#121213' : '#F1F1F4'
      }}
    />
  )
}

export { WalletsScreen }

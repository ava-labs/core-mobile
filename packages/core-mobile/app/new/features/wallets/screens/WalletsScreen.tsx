import React from 'react'
import { WalletList } from '../components/WalletList'

const WalletsScreen = (): JSX.Element => {
  return (
    <WalletList
      title="My wallets"
      subtitle={`An overview of your wallets\nand associated accounts`}
    />
  )
}

export { WalletsScreen }

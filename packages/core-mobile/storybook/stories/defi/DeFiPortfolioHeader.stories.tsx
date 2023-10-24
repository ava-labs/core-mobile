import React from 'react'
import type { Meta } from '@storybook/react-native'
import { DeFiPortfolioHeader } from 'screens/defi/components/DeFiPortfolioHeader'
import { withCenterView } from '../../decorators/withCenterView'
import { withCard } from '../../decorators/withCard'

export default {
  title: 'DeFi/DeFiPortfolioHeader',
  decorators: [withCard, withCenterView]
} as Meta

export const Default = () => (
  <DeFiPortfolioHeader
    logoUrl="https://static.debank.com/image/project/logo_url/prisma/6ac2a38555deaf89a6f1eb04eee5d9dd.png"
    name="Prisma Finance"
    chainLogoUrl="https://static.debank.com/image/chain/logo_url/eth/42ba589cd077e7bdd97db6480b0ff61d.png"
    chainName="Ethereum"
    totalValueOfProtocolItems="$5,155,920.18"
  />
)

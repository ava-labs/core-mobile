import {
  DeFiInsuranceBuyerItem,
  DeFiProtocolDetailTypes
} from 'services/defi/types'

export const DEFI_INSURANCE_BUYER_ITEMS: DeFiInsuranceBuyerItem[] = [
  {
    type: DeFiProtocolDetailTypes.INSURANCE_BUYER,
    name: 'Insurance Buyer',
    expiredAt: 1622419200,
    description: 'Insurance for 9.86 DAI on BALANCER',
    netUsdValue: 1234.56
  },
  {
    type: DeFiProtocolDetailTypes.INSURANCE_BUYER,
    name: 'Insurance Buyer',
    expiredAt: 1625419200,
    description: 'Insurance for 111 DAI on AAVE',
    netUsdValue: 123456.56
  }
]

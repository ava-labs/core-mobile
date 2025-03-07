import { Dimensions } from 'react-native'
import { AVAX_P_ID, AVAX_X_ID } from 'store/balance'

export const portfolioTabContentHeight = Dimensions.get('window').height / 2

export const isXLocalId = (localId?: string): boolean => localId === AVAX_X_ID
export const isPLocalId = (localId?: string): boolean => localId === AVAX_P_ID

export const isXpLocalId = (localId?: string): boolean =>
  isXLocalId(localId) || isPLocalId(localId)

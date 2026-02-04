import { Dimensions } from 'react-native'
import { Account } from 'store/account'

const width = Dimensions.get('window').width
const height = Dimensions.get('window').height

export const portfolioTabContentHeight = height / 2

const widthInches = width / 160
const heightInches = height / 160
const diagonalInches = Math.sqrt(widthInches ** 2 + heightInches ** 2)

export const isScreenLargerThan6_2Inches = diagonalInches > 6

export const isTxSentFromAccount = (
  txFrom: string,
  account?: Account
): boolean => {
  if (!account) return false

  return [
    account.addressAVM.toLowerCase(),
    account.addressSVM.toLowerCase(),
    account.addressBTC.toLowerCase(),
    account.addressPVM.toLowerCase(),
    account.addressC.toLowerCase()
  ].includes(txFrom.toLowerCase())
}

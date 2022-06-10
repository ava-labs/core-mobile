import { ChainId } from '@avalabs/chains-sdk'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'

// get the list of tokens for the active network
// each token will have info such as: balance, price, market cap,...
export const useTokens = () => {
  const network = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const addressC = activeAccount?.address
  const addressBtc = activeAccount?.addressBtc

  let addressToFetch

  if (network.chainId === ChainId.BITCOIN) {
    addressToFetch = addressBtc
  } else {
    addressToFetch = addressC
  }

  const tokensWithBalance = useSelector(
    selectTokensWithBalance(network.chainId, addressToFetch)
  )

  return tokensWithBalance
}

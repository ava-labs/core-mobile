import { ChainId } from '@avalabs/chains-sdk'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance'
import { selectActiveNetwork } from 'store/network'
import { useActiveAccount } from 'hooks/useActiveAccount'

// get the list of tokens for the active network
// each token will have info such as: balance, price, market cap,...
export const useTokens = () => {
  const network = useSelector(selectActiveNetwork)
  const account = useActiveAccount()

  let addressToFetch

  if (network.chainId === ChainId.BITCOIN) {
    addressToFetch = account?.addressBtc
  } else {
    addressToFetch = account?.address
  }

  const tokensWithBalance = useSelector(
    selectTokensWithBalance(network.chainId, addressToFetch ?? '')
  )

  return tokensWithBalance
}

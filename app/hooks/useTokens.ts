import { ChainId } from '@avalabs/chains-sdk'
import { useWalletContext } from '@avalabs/wallet-react-components'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance'
import { selectActiveNetwork } from 'store/network'

// get the list of tokens for the active network
// each token will have info such as: balance, price, market cap,...
export const useTokens = () => {
  const network = useSelector(selectActiveNetwork)
  // TODO get addresses from accounts reducer CP-2114
  const wallet = useWalletContext().wallet
  const addressC = wallet?.getAddressC() ?? ''
  const addressBtc = wallet?.getAddressBTC('bitcoin') ?? ''

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

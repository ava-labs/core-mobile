import {
  TokenListDict,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import { getContractDataErc20 } from '@avalabs/avalanche-wallet-sdk'
import { Erc20TokenData } from '@avalabs/avalanche-wallet-sdk/dist/Asset/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { useEffect } from 'react'
import { customErc20Tokens$ } from '@avalabs/wallet-react-components'

export type CustomTokens = {
  [chain: string]: TokenListDict
}

const useAddCustomToken = () => {
  const network = useSelector(selectActiveNetwork)
  const walletState = useWalletStateContext()
  const { customTokens, saveCustomTokens } =
    useApplicationContext().repo.customTokenRepo

  useEffect(() => {
    customErc20Tokens$.next(customTokens[network.chainId])
  }, [customTokens, network.chainId])

  async function addCustomToken(tokenAddress: string): Promise<Erc20TokenData> {
    // make sure we have an erc20 token list
    if (!walletState?.erc20Tokens) {
      return Promise.reject('No ERC20 tokens found in wallet.')
    }

    // last check to see if the token is not already added to the state
    const tokenAlreadyExists = walletState.erc20Tokens.reduce(
      (exists, existingToken) =>
        exists || existingToken.address === tokenAddress,
      false
    )
    if (tokenAlreadyExists) {
      return Promise.reject('Token already exists in the wallet.')
    }

    // we need to get the chain to be able to save custom token under correct chain
    const chain = network.chainId

    // we get the contract again...might change this since we already get it in the view
    try {
      const tokenData = await getContractDataErc20(tokenAddress)
      // no error, no data...reject promisse
      if (!tokenData) {
        return Promise.reject(`ERC20 contract ${tokenAddress} does not exist.`)
      }

      // create new object with new token
      const copy = customTokens ?? ({} as CustomTokens)
      const newCustomTokens = {
        ...copy,
        [chain]: {
          ...copy[chain],
          [tokenAddress]: tokenData
        }
      }

      // save it :) if `await` fails, it will be caught by try/catch
      await saveCustomTokens(newCustomTokens)

      return Promise.resolve(tokenData)
    } catch (e: any) {
      return Promise.reject(e.message)
    }
  }

  return { addCustomToken }
}

export default useAddCustomToken

import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { NFTItemData } from 'store/nft'
import { selectNfts } from 'store/balance'
import { addMissingFields } from 'services/nft/utils'
import { useMemo } from 'react'

// a hook to get nft item data for the current active network & account
export const useNfts = (): NFTItemData[] => {
  const account = useSelector(selectActiveAccount)
  const nfts = useSelector(selectNfts)

  if (!account?.addressC) {
    throw new Error('unable to get NFTs')
  }
  return useMemo(
    () => nfts.map(nft => addMissingFields(nft, account.addressC)),
    [nfts, account]
  )
}

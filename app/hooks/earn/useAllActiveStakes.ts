import { useQueries } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import WalletService from 'services/wallet/WalletService'
import { selectAccounts } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isOnGoing } from 'utils/earn/status'

export const useAllActiveStakes = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const oppositeIsDeveloperMode = !isDeveloperMode
  const accounts = useSelector(selectAccounts)
  const accountsArray = Object.values(accounts)

  return useQueries({
    queries: [
      {
        queryKey: ['stakes', isDeveloperMode, accountsArray],
        queryFn: async () => {
          const firstQueryParams = accountsArray.reduce((result, account) => {
            if (account.addressPVM) {
              result.push(account.addressPVM)
            }
            return result
          }, [] as string[])
          const tranformedTransactions = await getTransformedTransactions(
            firstQueryParams,
            isDeveloperMode
          )
          return tranformedTransactions
        }
      },
      {
        queryKey: ['stakes', oppositeIsDeveloperMode, accountsArray],
        queryFn: async () => {
          const indices = accountsArray.map(acc => acc.index)
          const secondQueryParams = await WalletService.getAddressesByIndices(
            indices,
            'P',
            false,
            oppositeIsDeveloperMode
          )
          const tranformedTransactions = await getTransformedTransactions(
            secondQueryParams,
            oppositeIsDeveloperMode
          )
          return tranformedTransactions
        }
      }
    ]
  })
}

const getTransformedTransactions = async (
  addresses: string[],
  isTestnet: boolean
) => {
  const stakes = await EarnService.getAllStakes({
    isTestnet,
    addresses
  })

  const now = new Date()
  const activeStakes =
    stakes?.filter(transaction => isOnGoing(transaction, now)) ?? []

  const transformedTransactions = activeStakes.map(transaction => {
    const pAddr = transaction.emittedUtxos.find(utxo => utxo.staked === true)
      ?.addresses[0]
    const matchedPAddress = addresses
      .map((addr, index) => {
        return { addr, index }
      })
      .find(mapped => {
        return mapped.addr === `P-${pAddr}`
      })
    return {
      ...transaction,
      index: matchedPAddress?.index ?? 0,
      isDeveloperMode: isTestnet
    }
  })
  return transformedTransactions
}

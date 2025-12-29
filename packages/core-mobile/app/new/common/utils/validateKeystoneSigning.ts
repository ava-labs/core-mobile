import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { Account } from 'store/account'
import { stripAddressPrefix } from './stripAddressPrefix'

// TODO: remove this once we update keystone SDK updated and have keystone signing working
// this function is a temporary solution to inform user to use core web UTXO selector to send transaction
export const validateKeystoneSigning = async ({
  chainAlias,
  account,
  isTestnet
}: {
  chainAlias: 'P' | 'X'
  account: Account
  isTestnet: boolean
}): Promise<boolean> => {
  const address = chainAlias === 'P' ? account.addressPVM : account.addressAVM
  const utxoSet =
    chainAlias === 'P'
      ? await AvalancheWalletService.getPChainUTXOs({
          account,
          isTestnet: !!isTestnet
        })
      : await AvalancheWalletService.getXChainUTXOs({
          account,
          isTestnet: !!isTestnet
        })

  const utxos = utxoSet.getUTXOs()

  // sort the utxos by amount in descending order for address index 0
  const primaryUtxos = utxos
    .filter(utxo =>
      utxo
        .getOutputOwners()
        .addrs.find(
          addr =>
            addr.toString().toLowerCase() ===
            stripAddressPrefix(address).toLowerCase()
        )
    )
    // @ts-ignore: TODO: use correct type
    .sort((a, b) => b.output?.amt - a.output?.amt)

  // sort the utxos by amount in descending order for address index 1 and above
  const otherUtxos = utxos
    .filter(utxo =>
      utxo
        .getOutputOwners()
        .addrs.find(
          addr =>
            addr.toString().toLowerCase() !==
            stripAddressPrefix(address).toLowerCase()
        )
    )
    // @ts-ignore: TODO: use correct type
    .sort((a, b) => b.output?.amt - a.output?.amt)

  // return true if the largest primary utxo is less than the largest other utxo
  // show alert if true for keystone wallet
  return (
    primaryUtxos.length > 0 &&
    otherUtxos.length > 0 &&
    // @ts-ignore: TODO: use correct type
    primaryUtxos[0]?.output?.amt < otherUtxos[0]?.output?.amt
  )
}

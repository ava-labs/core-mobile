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
  const primaryUtxo = utxos.find(utxo =>
    utxo
      .getOutputOwners()
      .addrs.find(
        addr =>
          addr.toString().toLowerCase() ===
          stripAddressPrefix(address).toLowerCase()
      )
  )

  const otherUtxos = utxos.filter(utxo => utxo.utxoId !== primaryUtxo?.utxoId)

  return otherUtxos.some(
    // @ts-ignore: TODO: use correct type
    utxo => utxo.output.amt > primaryUtxo?.output.amt
  )
}

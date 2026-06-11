import type {
  AvalancheCctInitializer,
  AvalancheSendTxParams
} from '@avalabs/fusion-sdk'
import { UnsignedTx } from '@avalabs/avalanchejs'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { getInternalExternalAddrs } from 'common/hooks/send/utils/getInternalExternalAddrs'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { AvalancheTransactionRequest, WalletType } from 'services/wallet/types'
import { Account, XPAddressDictionary } from 'store/account/types'

/**
 * Live state accessors the callbacks need at invocation time. Each is read on
 * every call so callbacks observe the latest account / wallet / xpAddresses
 * without needing to recreate the TransferManager when state changes.
 */
export type CctCallbackDeps = {
  getActiveAccount: () => Account | undefined
  getIsDeveloperMode: () => boolean
  getWallet: () => { id: string; type: WalletType } | undefined
  /**
   * Returns the active account's X/P addresses + signing dictionary. Async so
   * the implementation can fetch on a cold cache (the SDK signing path needs
   * accurate addresses; falling back to empty would produce invalid signatures).
   */
  getXpAddresses: () => Promise<{
    xpAddresses: string[]
    xpAddressDictionary: XPAddressDictionary
  }>
}

export type CctCallbacks = Pick<
  AvalancheCctInitializer,
  | 'avalancheSendTx'
  | 'getCoreEthAddress'
  | 'getAtomicUtxos'
  | 'getUtxos'
  | 'getWalletAddressesForChainAlias'
  | 'getWalletChangeAddressForChainAlias'
>

/**
 * Builds the six callbacks required by the Fusion SDK's
 * `AvalancheCctInitializer` from mobile's existing wallet/network primitives.
 *
 * - `avalancheSendTx` signs the SDK-built export/import tx via `WalletService`
 *   and broadcasts it via the Avalanche XP provider (same path the earn flow
 *   uses for staking exports/imports).
 * - The address callbacks read from the live wallet via
 *   `AvalancheWalletService.getReadOnlySigner` (which wraps
 *   `Avalanche.AddressWallet` from core-wallets-sdk).
 * - The UTXO callbacks delegate to the same wallet's `getUTXOs` /
 *   `getAtomicUTXOs` methods.
 *
 * All callbacks throw if the active account isn't available at call time, or
 * if the underlying XP addresses can't be derived (empty list / empty signing
 * dictionary). `avalancheSendTx` additionally throws if no active wallet is
 * available. The consumer should gate enablement on those being present
 * before initializing the service.
 */
export const createCctCallbacks = (deps: CctCallbackDeps): CctCallbacks => {
  const getRequiredAccount = (): Account => {
    const account = deps.getActiveAccount()
    if (!account) throw new Error('[cctCallbacks] no active account')
    return account
  }

  const getRequiredWallet = (): { id: string; type: WalletType } => {
    const wallet = deps.getWallet()
    if (!wallet) throw new Error('[cctCallbacks] no active wallet')
    return wallet
  }

  const getReadOnlySigner = async (): Promise<Avalanche.AddressWallet> => {
    const account = getRequiredAccount()
    const isTestnet = deps.getIsDeveloperMode()
    const { xpAddresses } = await deps.getXpAddresses()
    if (xpAddresses.length === 0) {
      // Defensive: getCachedXPAddresses normally fetches on a cold cache, so
      // an empty list here means address derivation failed for this wallet
      // (e.g. Keystone non-primary account). Refuse to build the wallet
      // rather than silently producing an Avalanche.AddressWallet with no
      // X/P addresses, which would return empty UTXOs and empty addresses.
      throw new Error('[cctCallbacks] xpAddresses empty for active account')
    }
    return AvalancheWalletService.getReadOnlySigner({
      account,
      isTestnet,
      xpAddresses
    })
  }

  const avalancheSendTx: CctCallbacks['avalancheSendTx'] = async ({
    chainAlias,
    unsignedTx
  }: AvalancheSendTxParams) => {
    const account = getRequiredAccount()
    const wallet = getRequiredWallet()
    const isTestnet = deps.getIsDeveloperMode()
    const { xpAddressDictionary } = await deps.getXpAddresses()
    if (Object.keys(xpAddressDictionary).length === 0) {
      // Defensive: an empty dictionary would make getInternalExternalAddrs
      // return empty signing indices, and the wallet's signer could then
      // fall back to default derivation paths and produce a signature that
      // doesn't match the UTXO output owners. Fail fast.
      throw new Error(
        '[cctCallbacks] xpAddressDictionary empty for active account'
      )
    }

    // The Avalanche XP provider handles atomic txs for C, P, and X chains —
    // this matches the existing earn flow's network resolution. For X-only
    // (non-atomic) calls we use the X network, otherwise stay on P.
    const network =
      chainAlias === 'X'
        ? NetworkService.getAvalancheNetworkX(isTestnet)
        : NetworkService.getAvalancheNetworkP(isTestnet)

    const signedTxJson = await WalletService.sign({
      walletId: wallet.id,
      walletType: wallet.type,
      transaction: {
        tx: unsignedTx,
        ...getInternalExternalAddrs({
          utxos: unsignedTx.utxos,
          xpAddressDict: xpAddressDictionary,
          isTestnet
        })
      } as AvalancheTransactionRequest,
      accountIndex: account.index,
      network
    })

    const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

    return NetworkService.sendTransaction({ signedTx, network })
  }

  const getCoreEthAddress: CctCallbacks['getCoreEthAddress'] = () => {
    const { addressCoreEth } = getRequiredAccount()
    if (!addressCoreEth) {
      // Defensive: addressCoreEth is typed `string` on Account but can be
      // empty for wallets that don't derive a Coreth bech32 address (some
      // Ledger paths). Returning '' would only surface as an opaque SDK
      // failure later — fail fast instead.
      throw new Error('[cctCallbacks] addressCoreEth empty for active account')
    }
    return addressCoreEth
  }

  const getAtomicUtxos: CctCallbacks['getAtomicUtxos'] = async (
    destinationChain,
    sourceChain
  ) => {
    const signer = await getReadOnlySigner()
    return signer.getAtomicUTXOs(destinationChain, sourceChain)
  }

  const getUtxos: CctCallbacks['getUtxos'] = async chainAlias => {
    const signer = await getReadOnlySigner()
    return signer.getUTXOs(chainAlias)
  }

  const getWalletAddressesForChainAlias: CctCallbacks['getWalletAddressesForChainAlias'] =
    async chainAlias => {
      const signer = await getReadOnlySigner()
      return signer.getAddresses(chainAlias)
    }

  const getWalletChangeAddressForChainAlias: CctCallbacks['getWalletChangeAddressForChainAlias'] =
    async chainAlias => {
      const signer = await getReadOnlySigner()
      return signer.getChangeAddress(chainAlias)
    }

  return {
    avalancheSendTx,
    getCoreEthAddress,
    getAtomicUtxos,
    getUtxos,
    getWalletAddressesForChainAlias,
    getWalletChangeAddressForChainAlias
  }
}

import type {
  AvalancheCctInitializer,
  AvalancheSendTxParams
} from '@avalabs/fusion-sdk'
import { utils } from '@avalabs/avalanchejs'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { AvalancheSendTransactionParams } from '@avalabs/avalanche-module'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getInternalExternalAddrs } from 'common/hooks/send/utils/getInternalExternalAddrs'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import NetworkService from 'services/network/NetworkService'
import { WalletType } from 'services/wallet/types'
import { Account, XPAddressDictionary } from 'store/account/types'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { RequestContext } from 'store/rpc/types'
import { getAvalancheCaip2ChainId } from 'utils/caip2ChainIds'

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
  /**
   * Dispatches an in-app RPC request through the approval pipeline. Used by
   * `avalancheSendTx` to surface an approval modal for each leg (export tx
   * then import tx) — same path the X/P send flows use.
   */
  request: Request
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
 * - `avalancheSendTx` dispatches an `avalanche_sendTransaction` RPC request
 *   for the SDK-built export/import tx so the user sees an approval modal
 *   per leg (same pipeline the X/P send screens use). The handler signs and
 *   broadcasts after approval and returns the resulting tx hash.
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
    txType,
    unsignedTx
  }: AvalancheSendTxParams) => {
    getRequiredAccount()
    getRequiredWallet()
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

    const manager = utils.getManagerForVM(unsignedTx.getVM())
    const unsignedTxBytes = unsignedTx.toBytes()
    const [codec] = manager.getCodecFromBuffer(unsignedTxBytes)

    const params: AvalancheSendTransactionParams = {
      transactionHex: utils.bufferToHex(unsignedTxBytes),
      chainAlias,
      utxos: unsignedTx.utxos.map(utxo =>
        utils.bufferToHex(utxo.toBytes(codec))
      ),
      ...getInternalExternalAddrs({
        utxos: unsignedTx.utxos,
        xpAddressDict: xpAddressDictionary,
        isTestnet
      })
    }

    // Suppress the "Transaction sent / successful" toast for the export leg —
    // a normal CCT swap is export → import, and the user should only see one
    // success toast when the final import lands. Recovery quotes (import-only)
    // still get the toast since the import is the only tx.
    const context =
      txType === 'export'
        ? { [RequestContext.SUPPRESS_TX_FEEDBACK]: true }
        : undefined

    return deps.request({
      method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
      params,
      chainId: getAvalancheCaip2ChainId(network.chainId),
      context
    })
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

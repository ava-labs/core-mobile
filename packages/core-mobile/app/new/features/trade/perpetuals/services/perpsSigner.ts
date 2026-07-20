import type {
  Address,
  HyperliquidAgentSignTypedDataArgs,
  HyperliquidUserSignedTypedDataArgs,
  HyperliquidUserSigner,
  PerpsEvmSigner
} from '@avalabs/perps-sdk'
import { RpcMethod } from '@avalabs/vm-module-types'
import { recoverTypedDataAddress, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { Request } from 'store/rpc/utils/createInAppRequest'
import Logger from 'utils/Logger'

/**
 * Route the in-app approval on C-Chain. Hyperliquid *user-signed* typed data
 * still carries domain.chainId 421614 (Arbitrum Sepolia) for the signature
 * hash — Core signs that payload regardless of the request's CAIP-2 chain.
 * Using 421614 as the request chain fails because that network is not in the
 * wallet's network list, so the approval sheet never opens.
 *
 * L1 Agent actions (place/cancel/leverage) use domain.chainId 1337 and are
 * signed in-process with the agent key — they never hit this RPC path.
 */
const CCHAIN_CAIP2 = 'eip155:43114'

/**
 * `EIP712Domain` type definition required by `eth_signTypedData_v4`. The
 * perps-sdk omits it from its typed-data args (it only carries the action
 * types), so we prepend it before handing the payload to the wallet.
 */
const EIP712_DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

type SignArgs =
  | HyperliquidUserSignedTypedDataArgs
  | HyperliquidAgentSignTypedDataArgs

/**
 * Hermes has historically had buggy `DataView.setBigUint64`. perps-sdk's L1
 * `actionHash` uses it for the nonce — a wrong hash makes HL recover a
 * phantom address ("User or API Wallet 0x… does not exist") even when the
 * agent is correctly approved. Patch once if the native impl disagrees with
 * the manual big-endian write.
 */
let didEnsureBigUint64 = false
export function ensureBigUint64Safe(): void {
  if (didEnsureBigUint64) {
    return
  }
  didEnsureBigUint64 = true

  const probe = 0x0102030405060708n
  const native = new Uint8Array(8)
  let nativeOk = false
  if (typeof DataView.prototype.setBigUint64 === 'function') {
    try {
      new DataView(native.buffer).setBigUint64(0, probe, false)
      nativeOk =
        native[0] === 0x01 &&
        native[1] === 0x02 &&
        native[2] === 0x03 &&
        native[3] === 0x04 &&
        native[4] === 0x05 &&
        native[5] === 0x06 &&
        native[6] === 0x07 &&
        native[7] === 0x08
    } catch {
      nativeOk = false
    }
  }

  Logger.info('[perps] DataView.setBigUint64', {
    present: typeof DataView.prototype.setBigUint64 === 'function',
    nativeOk,
    nativeBytes: Array.from(native)
  })

  if (nativeOk) {
    return
  }

  DataView.prototype.setBigUint64 = function setBigUint64Patched(
    byteOffset: number,
    value: bigint,
    littleEndian?: boolean
  ): void {
    const v = BigInt(value)
    if (littleEndian) {
      this.setUint32(byteOffset, Number(v & 0xffffffffn), true)
      this.setUint32(byteOffset + 4, Number(v >> 32n), true)
    } else {
      this.setUint32(byteOffset, Number(v >> 32n), false)
      this.setUint32(byteOffset + 4, Number(v & 0xffffffffn), false)
    }
  }
  Logger.info('[perps] patched DataView.setBigUint64 for Hermes')
}

/**
 * eth_signTypedData_v4 payloads must be JSON-serializable. perps-sdk user-signed
 * actions carry `bigint` nonces / domain chainIds — coerce to JSON-safe numbers
 * when they fit in a safe integer (HL timestamps do). Prefer number over string
 * so eth-sig-util's uint encoding matches Hyperliquid's numeric reconstruction.
 */
const sanitizeEip712Json = (value: unknown): unknown => {
  if (typeof value === 'bigint') {
    const asNumber = Number(value)
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
  }
  // Keep bytes / typed arrays intact — L1 `connectionId` is bytes32 and must
  // not be turned into a plain object by the recursive branch below.
  if (value instanceof Uint8Array) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeEip712Json)
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sanitizeEip712Json(entry)
      ])
    )
  }
  return value
}

/**
 * Sign a Hyperliquid EIP-712 payload through the app's in-app RPC pipeline
 * (shows the standard approval UI, works across mnemonic / seedless / Ledger /
 * Keystone). Adds `EIP712Domain` and sanitizes bigints for the wire format.
 */
async function signTypedDataViaRequest(
  address: Address,
  request: Request,
  args: SignArgs
): Promise<Hex> {
  const typedData = sanitizeEip712Json({
    types: { EIP712Domain: EIP712_DOMAIN_TYPE, ...args.types },
    domain: { ...args.domain, chainId: Number(args.domain.chainId) },
    primaryType: args.primaryType,
    message: args.message
  })

  const signature = await request({
    method: RpcMethod.SIGN_TYPED_DATA_V4,
    params: [address, typedData],
    chainId: CCHAIN_CAIP2
  })

  return signature as Hex
}

/**
 * Master-wallet signer for Hyperliquid *user-signed* actions (e.g.
 * `approveAgent`). One wallet prompt per call.
 */
export function createUserSigner(
  address: Address,
  request: Request
): HyperliquidUserSigner {
  return {
    address,
    signTypedData: args => signTypedDataViaRequest(address, request, args)
  }
}

/**
 * Master-wallet fallback signer for L1 `Agent` actions, used when no agent key
 * is approved yet (every trade prompts the wallet). Once an agent is approved,
 * the manager uses `createAgentPerpsSigner` instead (silent signing).
 */
export function createWalletPerpsSigner(
  address: Address,
  request: Request
): PerpsEvmSigner {
  // Same underlying implementation as the user signer (both sign a Hyperliquid
  // EIP-712 payload through the in-app RPC pipeline); the L1 `Agent` args are a
  // structural subset of the user-signed args.
  return createUserSigner(address, request) as unknown as PerpsEvmSigner
}

/**
 * In-process agent signer for silent L1 actions. Signs EIP-712 exactly like
 * perps-sdk's `createAgentSigner` (same domain/types/message) so the wire
 * signature matches what Hyperliquid recomputes, and logs the locally
 * recovered address so a signature/hash mismatch shows up immediately.
 */
export function createAgentPerpsSigner(privateKey: Hex): PerpsEvmSigner {
  const account = privateKeyToAccount(privateKey)

  return {
    address: account.address,
    signTypedData: async (
      args: HyperliquidAgentSignTypedDataArgs
    ): Promise<Hex> => {
      // viem's typed-data helpers type `domain.chainId` as `number`; the SDK
      // passes a `bigint` (1337n). Number(1337n) encodes identically for the
      // uint256 hash, and using it for BOTH sign + recover keeps them in sync.
      const domain = {
        ...args.domain,
        chainId: Number(args.domain.chainId)
      }

      const signature = await account.signTypedData({
        domain,
        types: args.types,
        primaryType: args.primaryType,
        message: args.message
      })

      try {
        const recovered = await recoverTypedDataAddress({
          domain,
          types: args.types,
          primaryType: args.primaryType,
          message: args.message,
          signature
        })
        Logger.info('[perps] L1 agent sign recovered', {
          expected: account.address,
          recovered,
          match: recovered.toLowerCase() === account.address.toLowerCase(),
          domainChainId: String(args.domain.chainId),
          primaryType: args.primaryType,
          connectionId: String(args.message.connectionId),
          source: String(args.message.source),
          signature
        })
      } catch (e) {
        Logger.info('[perps] L1 agent recover failed', String(e))
      }

      return signature
    }
  }
}

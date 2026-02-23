import { RpcMethod } from '@avalabs/vm-module-types'
import { BtcSigner } from '@avalabs/unified-asset-transfer'
import { getBitcoinCaip2ChainId } from 'utils/caip2ChainIds'
import { Request } from 'store/rpc/utils/createInAppRequest'
import Logger from 'utils/Logger'

/**
 * BTC Signer implementation for Fusion SDK
 *
 * This signer implements the BtcSigner interface required by the Fusion SDK
 * for Bitcoin transaction signing operations.
 */
export function createBtcSigner(
  request: Request,
  isDeveloperMode = false
): BtcSigner {
  const chainId = getBitcoinCaip2ChainId(!isDeveloperMode)

  return {
    /**
     * Sign a Bitcoin transaction with inputs and outputs
     */
    sign: async ({ inputs, outputs }) => {
      try {
        const result = await request({
          method: RpcMethod.BITCOIN_SIGN_TRANSACTION,
          params: {
            inputs,
            outputs
          },
          chainId
        })

        return result as `0x${string}`
      } catch (err) {
        Logger.error('[fusion::btcSigner.sign]', err)
        throw err
      }
    }
  }
}

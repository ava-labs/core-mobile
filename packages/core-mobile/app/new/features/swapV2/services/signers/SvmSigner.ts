import { RpcMethod } from '@avalabs/vm-module-types'
import { SolanaSigner } from '@avalabs/unified-asset-transfer'
import { SolanaCaip2ChainId } from '@avalabs/core-chains-sdk'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { assert } from 'store/rpc/utils/assert'
import Logger from 'utils/Logger'
import { RequestContext } from 'store/rpc/types'

/**
 * SVM Signer implementation for Fusion SDK
 *
 * This signer implements the SolanaSigner interface required by the Fusion SDK
 * for Solana transaction signing and sending operations.
 */
export function createSvmSigner(
  request: Request,
  isDeveloperMode = false
): SolanaSigner {
  const chainId = isDeveloperMode
    ? SolanaCaip2ChainId.DEVNET
    : SolanaCaip2ChainId.MAINNET

  return {
    signAndSend: async (
      { serializedTx, sendOptions, account },
      { currentSignature, requiredSignatures }
    ) => {
      assert(serializedTx, 'Invalid transaction: missing "serializedTx"')
      assert(account, 'Invalid transaction: missing "account"')

      try {
        const result = await request({
          method: RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION,
          params: [
            {
              account,
              serializedTx,
              sendOptions
            }
          ],
          chainId,
          context: {
            // we only want to show confetti for the final approval
            [RequestContext.CONFETTI_DISABLED]:
              requiredSignatures > currentSignature
          }
        })

        return result as `0x${string}`
      } catch (err) {
        Logger.error('[fusion::svmSigner.signAndSend]', err)
        throw err
      }
    }
  }
}

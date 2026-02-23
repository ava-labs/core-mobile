import { hex, utf8 } from '@scure/base'
import { bigIntToHex } from '@ethereumjs/util'
import { RpcMethod } from '@avalabs/vm-module-types'
import { EvmSignerWithMessage } from '@avalabs/unified-asset-transfer'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { assert } from 'store/rpc/utils/assert'
import Logger from 'utils/Logger'

/**
 * EVM Signer implementation for Fusion SDK
 *
 * This signer implements the EvmSignerWithMessage interface required by the Fusion SDK,
 * which includes both transaction signing and message signing capabilities.
 */
export function createEvmSigner(request: Request): EvmSignerWithMessage {
  return {
    /**
     * Sign and send an EVM transaction
     */
    sign: async ({ from, data, to, value, chainId }) => {
      assert(to, 'Invalid transaction: missing "to" field')
      assert(from, 'Invalid transaction: missing "from" field')
      assert(data, 'Invalid transaction: missing "data" field')
      assert(chainId, 'Invalid transaction: missing "chainId" field')

      try {
        const result = await request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: [
            {
              from,
              to,
              data,
              value: typeof value === 'bigint' ? bigIntToHex(value) : undefined,
              chainId
            }
          ],
          chainId: getEvmCaip2ChainId(Number(chainId))
        })

        return result as `0x${string}`
      } catch (err) {
        Logger.error('[fusion::evmSigner.sign]', err)
        throw err
      }
    },

    /**
     * Sign a message with the EVM account
     * Required by EvmSignerWithMessage interface
     */
    signMessage: async (data: {
      message: string
      address: `0x${string}`
      chainId: number
    }) => {
      const { message, address, chainId } = data

      assert(message, 'Invalid message signing request: missing "message"')
      assert(address, 'Invalid message signing request: missing "address"')

      try {
        const result = await request({
          method: RpcMethod.PERSONAL_SIGN,
          params: [`0x${hex.encode(utf8.decode(message))}`, address],
          chainId: getEvmCaip2ChainId(chainId)
        })

        return result as `0x${string}`
      } catch (err) {
        Logger.error('[fusion::evmSigner.signMessage]', err)
        throw err
      }
    }
  }
}

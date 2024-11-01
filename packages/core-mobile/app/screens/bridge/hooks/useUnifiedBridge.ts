import {
  BridgeType,
  Environment,
  createUnifiedBridgeService,
  getEnabledBridgeServices,
  type EvmBridgeInitializer,
  type EvmSigner,
  type AvaToBtcBridgeInitializer,
  type BtcToAvaBridgeInitializer,
  type BtcSigner,
  UnifiedBridgeService
} from '@avalabs/bridge-unified'
import { TransactionParams } from '@avalabs/evm-module'
import { RpcMethod } from '@avalabs/vm-module-types'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useSelector } from 'react-redux'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { selectActiveAccount } from 'store/account'
import { getBitcoinCaip2ChainId, getEvmCaip2ChainId } from 'temp/caip2ChainIds'

export const useUnifiedBridge = (
  isTest: boolean
): UseQueryResult<UnifiedBridgeService | undefined, Error> => {
  const activeAccount = useSelector(selectActiveAccount)
  const { activeNetwork } = useNetworks()
  const environment = isTest ? Environment.TEST : Environment.PROD
  const { request } = useInAppRequest()

  return useQuery({
    queryKey: [isTest, activeAccount, environment, 'unifiedBridge'],
    queryFn: async () => {
      if (!activeAccount) {
        return undefined
      }

      const bitcoinProvider = getBitcoinProvider(isTest)

      const evmSigner: EvmSigner = {
        sign: async ({ data, from, to }) => {
          if (typeof to !== 'string') throw new Error('invalid to field')
          const txParams: [TransactionParams] = [
            {
              from,
              to,
              data: data ?? undefined
            }
          ]

          return request({
            method: RpcMethod.ETH_SEND_TRANSACTION,
            params: txParams,
            chainId: getEvmCaip2ChainId(activeNetwork.chainId)
          }) as Promise<`0x${string}`>
        }
      }

      const btcSigner: BtcSigner = {
        sign: async txData => {
          return request({
            method: RpcMethod.BITCOIN_SEND_TRANSACTION,
            params: txData,
            chainId: getBitcoinCaip2ChainId(!isTest)
          })
        }
      }
      const cctpInitializer: EvmBridgeInitializer = {
        type: BridgeType.CCTP,
        signer: evmSigner
      }
      const icttErc20Initializer: EvmBridgeInitializer = {
        type: BridgeType.ICTT_ERC20_ERC20,
        signer: evmSigner
      }
      const avalancheEvmInitializer: EvmBridgeInitializer = {
        type: BridgeType.AVALANCHE_EVM,
        signer: evmSigner
      }
      const avalancheBtcInitializer: AvaToBtcBridgeInitializer = {
        type: BridgeType.AVALANCHE_AVA_BTC,
        signer: evmSigner,
        bitcoinFunctions: bitcoinProvider
      }
      const bitcoinAvaInitializer: BtcToAvaBridgeInitializer = {
        type: BridgeType.AVALANCHE_BTC_AVA,
        signer: btcSigner,
        bitcoinFunctions: bitcoinProvider
      }

      const enabledBridgeServices = await getEnabledBridgeServices(
        environment,
        [
          cctpInitializer,
          icttErc20Initializer,
          avalancheEvmInitializer,
          avalancheBtcInitializer,
          bitcoinAvaInitializer
        ]
      )
      return createUnifiedBridgeService({ environment, enabledBridgeServices })
    }
  })
}

import { jest } from '@jest/globals'
import NetworkService from 'services/network/NetworkService'
import {
  ChainId,
  Network,
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK
} from '@avalabs/core-chains-sdk'
import { Networks } from 'store/network/types'

import Logger from 'utils/Logger'
import { noop } from '@avalabs/core-utils-sdk'
import { NETWORK_P, NETWORK_P_TEST, NETWORK_X, NETWORK_X_TEST } from './consts'

type TNetworks = {
  [chainId: number]: { chainName: string }
}

const mockNetworks = {
  1: {
    chainName: 'Ethereum'
  },
  43114: {
    chainName: 'Avalanche'
  }
}
const mockDeBankNetworks = {
  56: {
    chainName: 'Binance Smart Chain'
  }
}

type TNetworkService = {
  fetchNetworks: ({
    includeSolana
  }: {
    includeSolana: boolean
  }) => Promise<TNetworks>
  fetchDeBankNetworks: () => Promise<TNetworks>
  getAvalancheNetworkP: (isDevMode: boolean) => Network
  getAvalancheNetworkX: (isDevMode: boolean) => Network
}

describe('NetworkService', () => {
  describe('getNetworks', () => {
    it('should fetch common networks and DeBank networks and return combined network data', async () => {
      jest
        .spyOn(NetworkService as unknown as TNetworkService, 'fetchNetworks')
        .mockResolvedValue(mockNetworks)
      jest
        .spyOn(
          NetworkService as unknown as TNetworkService,
          'fetchDeBankNetworks'
        )
        .mockResolvedValue(mockDeBankNetworks)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkP')
        .mockReturnValue({ chainName: 'Avalanche P' } as unknown as Network)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkX')
        .mockReturnValue({ chainName: 'Avalanche X' } as unknown as Network)

      const result = await NetworkService.getNetworks({ includeSolana: false })

      expect(result).toEqual({
        1: { chainName: 'Ethereum' },
        43114: { chainName: 'Avalanche' },
        56: { chainName: 'Binance Smart Chain' },
        [ChainId.BITCOIN]: BITCOIN_NETWORK,
        [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK,
        [ChainId.AVALANCHE_P]: NETWORK_P,
        [ChainId.AVALANCHE_TEST_P]: NETWORK_P_TEST,
        [ChainId.AVALANCHE_X]: NETWORK_X,
        [ChainId.AVALANCHE_TEST_X]: NETWORK_X_TEST
      })
    })

    it('should handle errors in fetchNetworks and fetchDeBankNetworks gracefully', async () => {
      const erc20Err = new TypeError('Network request failed')
      const deBankErr = new TypeError('Network request failed')
      jest
        .spyOn(NetworkService as unknown as TNetworkService, 'fetchNetworks')
        .mockRejectedValue(erc20Err)
      jest
        .spyOn(
          NetworkService as unknown as TNetworkService,
          'fetchDeBankNetworks'
        )
        .mockRejectedValue(deBankErr)
      jest.spyOn(Logger, 'error').mockImplementation(noop)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkP')
        .mockReturnValue({ chainName: 'Avalanche P' } as unknown as Network)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkX')
        .mockReturnValue({ chainName: 'Avalanche X' } as unknown as Network)

      const result = await NetworkService.getNetworks({ includeSolana: false })

      // Verify Logger was called for both fetch errors with the proxy source tag.
      // The underlying error object is passed as the second arg so Sentry preserves
      // the original error type and stack (i.e. it joins the existing TypeError:
      // Network request failed bucket rather than spawning a new fingerprint).
      expect(Logger.error).toHaveBeenCalledWith(
        '[NetworkService][fetchNetworks] failed',
        erc20Err,
        { source: 'proxy' }
      )
      expect(Logger.error).toHaveBeenCalledWith(
        '[NetworkService][fetchDeBankNetworks] failed',
        deBankErr,
        { source: 'proxy' }
      )

      // Expected result should include the default network mappings
      expect(result).toEqual({
        [ChainId.BITCOIN]: BITCOIN_NETWORK,
        [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK,
        [ChainId.AVALANCHE_P]: NETWORK_P,
        [ChainId.AVALANCHE_TEST_P]: NETWORK_P_TEST,
        [ChainId.AVALANCHE_X]: NETWORK_X,
        [ChainId.AVALANCHE_TEST_X]: NETWORK_X_TEST
      })
    })

    it('should exclude ChainId.AVALANCHE_LOCAL_ID from the final network data', async () => {
      jest
        .spyOn(NetworkService as unknown as TNetworkService, 'fetchNetworks')
        .mockResolvedValue(mockNetworks)
      jest
        .spyOn(
          NetworkService as unknown as TNetworkService,
          'fetchDeBankNetworks'
        )
        .mockResolvedValue({} as Networks)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkP')
        .mockReturnValue({ chainName: 'Avalanche P' } as unknown as Network)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkX')
        .mockReturnValue({ chainName: 'Avalanche X' } as unknown as Network)

      const result = await NetworkService.getNetworks({ includeSolana: false })

      expect(result[ChainId.AVALANCHE_LOCAL_ID]).toBeUndefined()
      expect(result[1]?.chainName).toEqual('Ethereum')
    })
  })
})

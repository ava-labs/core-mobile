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

const mockERC20Networks = {
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

describe('NetworkService', () => {
  describe('getNetworks', () => {
    it('should fetch ERC20 and DeBank networks and return combined network data', async () => {
      jest
        .spyOn(NetworkService as any, 'fetchERC20Networks')
        .mockResolvedValue(mockERC20Networks)
      jest
        .spyOn(NetworkService as any, 'fetchDeBankNetworks')
        .mockResolvedValue(mockDeBankNetworks)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkP')
        .mockReturnValue({ chainName: 'Avalanche P' } as unknown as Network)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkX')
        .mockReturnValue({ chainName: 'Avalanche X' } as unknown as Network)

      const result = await NetworkService.getNetworks()

      expect(result).toEqual({
        1: { chainName: 'Ethereum' },
        43114: { chainName: 'Avalanche' },
        56: { chainName: 'Binance Smart Chain' },
        [ChainId.BITCOIN]: BITCOIN_NETWORK,
        [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK,
        [ChainId.AVALANCHE_P]: { chainName: 'Avalanche P' },
        [ChainId.AVALANCHE_TEST_P]: { chainName: 'Avalanche P' },
        [ChainId.AVALANCHE_X]: { chainName: 'Avalanche X' },
        [ChainId.AVALANCHE_TEST_X]: { chainName: 'Avalanche X' }
      })
    })

    it('should handle errors in fetchERC20Networks and fetchDeBankNetworks gracefully', async () => {
      jest
        .spyOn(NetworkService as any, 'fetchERC20Networks')
        .mockRejectedValue('ERC20 fetch error')
      jest
        .spyOn(NetworkService as any, 'fetchDeBankNetworks')
        .mockRejectedValue('DeBank fetch error')
      jest.spyOn(Logger, 'error').mockImplementation(noop)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkP')
        .mockReturnValue({ chainName: 'Avalanche P' } as unknown as Network)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkX')
        .mockReturnValue({ chainName: 'Avalanche X' } as unknown as Network)

      const result = await NetworkService.getNetworks()

      // Verify Logger was called for both fetch errors
      expect(Logger.error).toHaveBeenCalledWith(
        '[NetworkService][fetchERC20Networks]ERC20 fetch error'
      )
      expect(Logger.error).toHaveBeenCalledWith(
        '[NetworkService][fetchDeBankNetworks]DeBank fetch error'
      )

      // Expected result should include the default network mappings
      expect(result).toEqual({
        [ChainId.BITCOIN]: BITCOIN_NETWORK,
        [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK,
        [ChainId.AVALANCHE_P]: { chainName: 'Avalanche P' },
        [ChainId.AVALANCHE_TEST_P]: { chainName: 'Avalanche P' },
        [ChainId.AVALANCHE_X]: { chainName: 'Avalanche X' },
        [ChainId.AVALANCHE_TEST_X]: { chainName: 'Avalanche X' }
      })
    })

    it('should exclude ChainId.AVALANCHE_LOCAL_ID from the final network data', async () => {
      jest
        .spyOn(NetworkService as any, 'fetchERC20Networks')
        .mockResolvedValue(mockERC20Networks)
      jest
        .spyOn(NetworkService as any, 'fetchDeBankNetworks')
        .mockResolvedValue({} as Networks)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkP')
        .mockReturnValue({ chainName: 'Avalanche P' } as unknown as Network)
      jest
        .spyOn(NetworkService, 'getAvalancheNetworkX')
        .mockReturnValue({ chainName: 'Avalanche X' } as unknown as Network)

      const result = await NetworkService.getNetworks()

      expect(result[ChainId.AVALANCHE_LOCAL_ID]).toBeUndefined()
      expect(result).toEqual(
        expect.objectContaining({ 1: { chainName: 'Ethereum' } })
      )
    })
  })
})

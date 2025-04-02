import ModuleManager from 'vmModule/ModuleManager'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { Module, NetworkFees } from '@avalabs/vm-module-types'
import NetworkFeeService from './NetworkFeeService'

const loadModuleSpy = jest.spyOn(ModuleManager, 'loadModuleByNetwork')

describe('NetworkFeeService', () => {
  const mockNetwork = {
    vmName: NetworkVMType.AVM
  } as Network

  const mockNetworkFees = {
    baseFee: 100n,
    low: {
      maxFeePerGas: 10n,
      maxPriorityFeePerGas: 2n
    },
    medium: {
      maxFeePerGas: 20n,
      maxPriorityFeePerGas: 3n
    },
    high: {
      maxFeePerGas: 30n,
      maxPriorityFeePerGas: 4n
    },
    isFixedFee: false
  }

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  it('should return the correct network fee structure', async () => {
    loadModuleSpy.mockResolvedValue({
      getNetworkFee: jest.fn().mockResolvedValue(mockNetworkFees)
    } as unknown as Module)

    const result = await NetworkFeeService.getNetworkFee(mockNetwork)

    const expected: NetworkFees = {
      baseFee: 100n,
      low: {
        maxFeePerGas: 10n,
        maxPriorityFeePerGas: 2n
      },
      medium: {
        maxFeePerGas: 20n,
        maxPriorityFeePerGas: 3n
      },
      high: {
        maxFeePerGas: 30n,
        maxPriorityFeePerGas: 4n
      },
      isFixedFee: false
    }

    expect(result).toEqual(expected)
  })

  it('should handle missing maxPriorityFeePerGas for low priority', async () => {
    const modifiedNetworkFees = {
      ...mockNetworkFees,
      low: {
        maxFeePerGas: 10n,
        maxPriorityFeePerGas: undefined
      }
    }
    loadModuleSpy.mockResolvedValue({
      getNetworkFee: jest.fn().mockResolvedValue(modifiedNetworkFees)
    } as unknown as Module)

    const result = await NetworkFeeService.getNetworkFee(mockNetwork)

    expect(result).toEqual({
      baseFee: 100n,
      low: {
        maxFeePerGas: 10n,
        maxPriorityFeePerGas: undefined
      },
      medium: {
        maxFeePerGas: 20n,
        maxPriorityFeePerGas: 3n
      },
      high: {
        maxFeePerGas: 30n,
        maxPriorityFeePerGas: 4n
      },
      isFixedFee: false
    })
  })

  it('should throw if module cannot load fees', async () => {
    loadModuleSpy.mockResolvedValue({
      getNetworkFee: jest
        .fn()
        .mockRejectedValue(new Error('Failed to load fees'))
    } as unknown as Module)
    await expect(NetworkFeeService.getNetworkFee(mockNetwork)).rejects.toThrow(
      'Failed to load fees'
    )
    expect(ModuleManager.loadModuleByNetwork).toHaveBeenCalledWith(mockNetwork)
  })
})

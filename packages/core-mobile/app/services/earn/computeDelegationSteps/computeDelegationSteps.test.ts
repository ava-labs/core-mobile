import { pvm } from '@avalabs/avalanchejs'
import { Network } from '@avalabs/core-chains-sdk'
import { Avalanche, JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import * as utils from './utils'
import { computeDelegationSteps } from './computeDelegationSteps'

jest.mock('services/balance/getPChainBalance')
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  getPChainAtomicBalance: jest.fn(),
  getDelegationFee: jest.fn(),
  getImportPFee: jest.fn(),
  getExportCFee: jest.fn(),
  getDelegationFeePostPImport: jest.fn(),
  getDelegationFeePostCExportAndPImport: jest.fn(),
  getImportPFeePostCExport: jest.fn()
}))

const avalancheEvmProvider = {
  getTransactionCount: jest.fn().mockResolvedValue(0)
} as unknown as JsonRpcBatchInternal

describe('computeDelegationSteps', () => {
  const testXpAddresses = ['avax123', 'avax456']

  afterEach(() => {
    jest.clearAllMocks()
  })

  const defaultParams = {
    stakeAmount: 100n,
    currency: 'AVAX',
    avaxXPNetwork: {} as Network,
    account: {
      index: 0,
      addressPVM: 'test-pvm-address',
      addressCoreEth: 'test-core-eth-address'
    } as never,
    feeState: {} as pvm.FeeState,
    cAddress: 'test-c-address',
    cChainBalance: {} as TokenUnit,
    cChainBaseFee: {} as TokenUnit,
    provider: {} as Avalanche.JsonRpcProvider,
    pFeeAdjustmentThreshold: 5,
    crossChainFeesMultiplier: 4,
    cBaseFeeMultiplier: 1,
    xpAddresses: testXpAddresses
  }

  it('should throw an error when there is insufficient balance', async () => {
    ;(utils.getPChainAtomicBalance as jest.Mock).mockResolvedValue(0n)

    await expect(
      computeDelegationSteps({
        ...defaultParams,
        pChainBalance: {
          balancePerType: { unlockedUnstaked: 0n }
        } as TokenWithBalancePVM,
        avalancheEvmProvider
      })
    ).rejects.toThrow('Insufficient balance for the stake amount and fees.')
  })

  it('should return delegation step when there is enough P-Chain balance', async () => {
    ;(utils.getDelegationFee as jest.Mock).mockResolvedValue(10n)

    const steps = await computeDelegationSteps({
      ...defaultParams,
      pChainBalance: {
        balancePerType: { unlockedUnstaked: 200n }
      } as TokenWithBalancePVM,
      avalancheEvmProvider
    })

    expect(steps).toEqual([
      {
        operation: 'delegate',
        amount: 100n,
        fee: 10n
      }
    ])
  })

  it('should return import and delegation steps when P-Chain atomic balance combined with P-chain balance is enough', async () => {
    ;(utils.getDelegationFee as jest.Mock).mockRejectedValue(new Error('error'))
    ;(utils.getPChainAtomicBalance as jest.Mock).mockResolvedValue(150n)
    ;(utils.getImportPFee as jest.Mock).mockResolvedValue(5n)
    ;(utils.getDelegationFeePostPImport as jest.Mock).mockResolvedValue(10n)

    const steps = await computeDelegationSteps({
      ...defaultParams,
      pChainBalance: {
        balancePerType: { unlockedUnstaked: 50n }
      } as TokenWithBalancePVM,
      avalancheEvmProvider
    })

    expect(steps).toEqual([
      { operation: 'importP', fee: 5n },
      {
        operation: 'delegate',
        amount: 100n,
        fee: 10n
      }
    ])
  })

  it('should return export, import, and delegation steps when transferring from C-Chain is needed', async () => {
    ;(utils.getPChainAtomicBalance as jest.Mock).mockResolvedValue(30n)
    ;(utils.getDelegationFee as jest.Mock).mockRejectedValue(new Error('error'))
    ;(utils.getDelegationFeePostPImport as jest.Mock).mockRejectedValue(
      new Error('error')
    )
    ;(utils.getExportCFee as jest.Mock).mockResolvedValue(5n)
    ;(utils.getImportPFeePostCExport as jest.Mock).mockResolvedValue(5n)
    ;(
      utils.getDelegationFeePostCExportAndPImport as jest.Mock
    ).mockResolvedValue(10n)

    const steps = await computeDelegationSteps({
      ...defaultParams,
      cChainBalance: new TokenUnit(200 * 10 ** 9, 9, 'AVAX'),
      pChainBalance: {
        balancePerType: { unlockedUnstaked: 50n }
      } as TokenWithBalancePVM,
      avalancheEvmProvider
    })

    expect(steps).toEqual([
      {
        operation: 'exportC',
        amount: 120n,
        fee: 5n
      },
      { operation: 'importP', fee: 5n },
      {
        operation: 'delegate',
        amount: 100n,
        fee: 10n
      }
    ])
  })

  it('should fall through to the C-Chain transfer when P-Chain covers stake + fee but not the additional outputs', async () => {
    // P-Chain (120) covers stake (100) + fee (10) but not the convenience
    // fee output (50). Case 1 must reject so the shortfall is sourced from
    // the C-Chain instead of failing later at delegation time.
    ;(utils.getDelegationFee as jest.Mock).mockResolvedValue(10n)
    ;(utils.getPChainAtomicBalance as jest.Mock).mockResolvedValue(0n)
    ;(utils.getExportCFee as jest.Mock).mockResolvedValue(5n)
    ;(utils.getImportPFeePostCExport as jest.Mock).mockResolvedValue(5n)
    ;(
      utils.getDelegationFeePostCExportAndPImport as jest.Mock
    ).mockResolvedValue(10n)

    const steps = await computeDelegationSteps({
      ...defaultParams,
      additionalOutputAmount: 50n,
      cChainBalance: new TokenUnit(200 * 10 ** 9, 9, 'AVAX'),
      pChainBalance: {
        balancePerType: { unlockedUnstaked: 120n }
      } as TokenWithBalancePVM,
      avalancheEvmProvider
    })

    // adjustedAllFees = ceil((5 + 5 + 10) * (1 + 4)) = 100
    // transfer = |(stake 100 + additional 50) - pBalance 120| - atomic 0 + 100
    //          = 30 + 100 = 130
    expect(steps).toEqual([
      { operation: 'exportC', amount: 130n, fee: 5n },
      { operation: 'importP', fee: 5n },
      { operation: 'delegate', amount: 100n, fee: 10n }
    ])
  })

  it('should include the additional output amount in the C-Chain transfer amount', async () => {
    ;(utils.getPChainAtomicBalance as jest.Mock).mockResolvedValue(0n)
    ;(utils.getDelegationFee as jest.Mock).mockRejectedValue(new Error('error'))
    ;(utils.getExportCFee as jest.Mock).mockResolvedValue(5n)
    ;(utils.getImportPFeePostCExport as jest.Mock).mockResolvedValue(5n)
    ;(
      utils.getDelegationFeePostCExportAndPImport as jest.Mock
    ).mockResolvedValue(10n)

    const steps = await computeDelegationSteps({
      ...defaultParams,
      additionalOutputAmount: 40n,
      cChainBalance: new TokenUnit(200 * 10 ** 9, 9, 'AVAX'),
      pChainBalance: {
        balancePerType: { unlockedUnstaked: 50n }
      } as TokenWithBalancePVM,
      avalancheEvmProvider
    })

    // adjustedAllFees = ceil((5 + 5 + 10) * (1 + 4)) = 100
    // transfer = |(stake 100 + additional 40) - pBalance 50| - atomic 0 + 100
    //          = 90 + 100 = 190
    expect(steps).toEqual([
      { operation: 'exportC', amount: 190n, fee: 5n },
      { operation: 'importP', fee: 5n },
      { operation: 'delegate', amount: 100n, fee: 10n }
    ])
  })
})

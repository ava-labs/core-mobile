import { pvm } from '@avalabs/avalanchejs'
import { Network } from '@avalabs/core-chains-sdk'
import { Avalanche, JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Account } from 'store/account'
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
  afterEach(() => {
    jest.clearAllMocks()
  })

  const defaultParams = {
    stakeAmount: 100n,
    currency: 'AVAX',
    avaxXPNetwork: {} as Network,
    account: { index: 0 } as Account,
    feeState: {} as pvm.FeeState,
    cAddress: 'test-c-address',
    cChainBalance: {} as TokenUnit,
    cChainBaseFee: {} as TokenUnit,
    provider: {} as Avalanche.JsonRpcProvider,
    pFeeAdjustmentThreshold: 5,
    crossChainFeesMultiplier: 4,
    cBaseFeeMultiplier: 1
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
})

import { pvm } from '@avalabs/avalanchejs'
import { Network } from '@avalabs/core-chains-sdk'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { getPChainBalance } from 'services/balance/getPChainBalance'
import { getCChainBalance } from 'services/balance/getCChainBalance'
import * as utils from './utils'
import { computeDelegationSteps } from './computeDelegationSteps'

jest.mock('services/balance/getPChainBalance')
jest.mock('services/balance/getCChainBalance')
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

describe('computeDelegationSteps', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const defaultParams = {
    pAddress: 'test-p-address',
    stakeAmount: 100n,
    currency: 'AVAX',
    avaxXPNetwork: {} as Network,
    walletId: 'test-wallet-id',
    accountIndex: 0,
    feeState: {} as pvm.FeeState,
    cAddress: 'test-c-address',
    cChainNetwork: {} as Network,
    cChainBaseFee: {} as TokenUnit,
    provider: {} as Avalanche.JsonRpcProvider,
    pFeeAdjustmentThreshold: 5,
    crossChainFeesMultiplier: 4,
    cBaseFeeMultiplier: 1
  }

  it('should throw an error when there is insufficient balance', async () => {
    ;(getPChainBalance as jest.Mock).mockResolvedValue({
      balancePerType: { unlockedUnstaked: 0n }
    })
    ;(utils.getPChainAtomicBalance as jest.Mock).mockResolvedValue(0n)
    ;(getCChainBalance as jest.Mock).mockResolvedValue({ balance: 0 })

    await expect(computeDelegationSteps(defaultParams)).rejects.toThrow(
      'Insufficient balance for the stake amount and fees.'
    )
  })

  it('should return delegation step when there is enough P-Chain balance', async () => {
    ;(getPChainBalance as jest.Mock).mockResolvedValue({
      balancePerType: { unlockedUnstaked: 200n }
    })
    ;(utils.getDelegationFee as jest.Mock).mockResolvedValue(10n)

    const steps = await computeDelegationSteps(defaultParams)

    expect(steps).toEqual([
      {
        operation: 'delegate',
        amount: 100n,
        fee: 10n
      }
    ])
  })

  it('should return import and delegation steps when P-Chain atomic balance combined with P-chain balance is enough', async () => {
    ;(getPChainBalance as jest.Mock).mockResolvedValue({
      balancePerType: { unlockedUnstaked: 50n }
    })
    ;(utils.getDelegationFee as jest.Mock).mockRejectedValue(new Error('error'))
    ;(utils.getPChainAtomicBalance as jest.Mock).mockResolvedValue(150n)
    ;(utils.getImportPFee as jest.Mock).mockResolvedValue(5n)
    ;(utils.getDelegationFeePostPImport as jest.Mock).mockResolvedValue(10n)

    const steps = await computeDelegationSteps(defaultParams)

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
    ;(getPChainBalance as jest.Mock).mockResolvedValue({
      balancePerType: { unlockedUnstaked: 50n }
    })
    ;(getCChainBalance as jest.Mock).mockResolvedValue({
      balance: BigInt(200 * 10 ** 9)
    })
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

    const steps = await computeDelegationSteps(defaultParams)

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

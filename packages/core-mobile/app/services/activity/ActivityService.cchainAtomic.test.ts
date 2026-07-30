import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { PChainTransactionType } from '@avalabs/glacier-sdk'
import GlacierService from 'services/glacier/GlacierService'
import ModuleManager from 'vmModule/ModuleManager'
import ActivityService from './ActivityService'

jest.mock('services/glacier/GlacierService')
jest.mock('vmModule/ModuleManager')

const C_CHAIN_ID = 43114
const account = { addressC: '0xUser' } as never
const cChainNetwork = {
  chainId: C_CHAIN_ID,
  vmName: NetworkVMType.EVM,
  isTestnet: false,
  explorerUrl: 'https://subnets.avax.network/c-chain',
  networkToken: { symbol: 'AVAX' }
} as never

const evmTx = {
  hash: '0xevm',
  timestamp: 1_700_000_050_000, // ms — EVM module emits blockTimestamp*1000
  from: '0xUser',
  to: '0xOther',
  tokens: [{ type: 'native', symbol: 'AVAX', amount: '2' }],
  chainId: String(C_CHAIN_ID),
  txType: 'Send',
  isContractCall: false
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(ModuleManager.loadModuleByNetwork as jest.Mock).mockResolvedValue({
    getTransactionHistory: jest
      .fn()
      .mockResolvedValue({ transactions: [evmTx], nextPageToken: 'evm-next' })
  })
})

describe('ActivityService C-Chain atomic merge', () => {
  it('merges atomic import/export into C-Chain first page, sorted desc, deduped', async () => {
    ;(
      GlacierService.listCChainAtomicTransactions as jest.Mock
    ).mockResolvedValue({
      transactions: [
        {
          txHash: '0ximport',
          timestamp: 1_700_000_100,
          txType: 'ImportTx',
          destinationChain: 'c-chain',
          sourceChain: 'p-chain',
          evmOutputs: [
            {
              toAddress: '0xUser',
              asset: {
                assetId: 'avax',
                symbol: 'AVAX',
                name: 'Avalanche',
                denomination: 9,
                amount: '1000000000'
              }
            }
          ],
          amountCreated: [
            {
              assetId: 'avax',
              symbol: 'AVAX',
              name: 'Avalanche',
              denomination: 9,
              amount: '1000000000'
            }
          ]
        }
      ],
      nextPageToken: ''
    })

    const res = await ActivityService.getActivities({
      network: cChainNetwork,
      account,
      nextPageToken: undefined,
      shouldAnalyzeBridgeTxs: false
    })

    const hashes = res.transactions.map(t => t.hash)
    expect(hashes).toContain('0ximport')
    expect(hashes).toContain('0xevm')
    expect(hashes.indexOf('0ximport')).toBeLessThan(hashes.indexOf('0xevm'))
    const imp = res.transactions.find(t => t.hash === '0ximport')
    expect(imp?.txType).toBe(PChainTransactionType.IMPORT_TX)
    expect(res.nextPageToken).toBe('evm-next')
  })

  it('does NOT fetch atomic txs on non-first pages', async () => {
    await ActivityService.getActivities({
      network: cChainNetwork,
      account,
      nextPageToken: 'evm-next',
      shouldAnalyzeBridgeTxs: false
    })
    expect(GlacierService.listCChainAtomicTransactions).not.toHaveBeenCalled()
  })

  it('does NOT fetch atomic txs for non-C-Chain networks', async () => {
    await ActivityService.getActivities({
      network: {
        ...(cChainNetwork as unknown as Record<string, unknown>),
        chainId: 1
      } as never,
      account,
      nextPageToken: undefined,
      shouldAnalyzeBridgeTxs: false
    })
    expect(GlacierService.listCChainAtomicTransactions).not.toHaveBeenCalled()
  })

  it('never breaks the EVM history when the atomic fetch rejects', async () => {
    // The fetch is kicked off before the EVM history is awaited, so its
    // promise must never reject — a Glacier failure has to degrade to "no
    // atomic rows", leaving the EVM history fully intact.
    ;(
      GlacierService.listCChainAtomicTransactions as jest.Mock
    ).mockRejectedValue(new Error('glacier atomic endpoint down'))

    const res = await ActivityService.getActivities({
      network: cChainNetwork,
      account,
      nextPageToken: undefined,
      shouldAnalyzeBridgeTxs: false
    })

    expect(res.transactions.map(t => t.hash)).toEqual(['0xevm'])
    expect(res.nextPageToken).toBe('evm-next')
  })

  it('threads the caller pageSize through to the atomic Glacier fetch', async () => {
    // The atomic request should match the caller's page size rather than
    // always pulling Glacier's 100-item default.
    ;(
      GlacierService.listCChainAtomicTransactions as jest.Mock
    ).mockResolvedValue({ transactions: [], nextPageToken: '' })

    await ActivityService.getActivities({
      network: cChainNetwork,
      account,
      nextPageToken: undefined,
      shouldAnalyzeBridgeTxs: false,
      pageSize: 25
    })

    expect(GlacierService.listCChainAtomicTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 25 })
    )
  })
})

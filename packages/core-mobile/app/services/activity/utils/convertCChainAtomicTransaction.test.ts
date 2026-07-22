import { TokenType } from '@avalabs/vm-module-types'
import {
  CChainExportTransaction,
  CChainImportTransaction
} from '@avalabs/glacier-sdk'
import { PChainTransactionType } from '@avalabs/glacier-sdk'
import { convertCChainAtomicTransaction } from './convertCChainAtomicTransaction'

const USER = '0xUser'
const C_CHAIN_ID = 43114
const EXPLORER = 'https://subnets.avax.network/c-chain'

const AVAX_ASSET = {
  assetId: 'avax',
  name: 'Avalanche',
  symbol: 'AVAX',
  denomination: 9,
  type: 'secp256k1' as never,
  amount: '1500000000' // 1.5 AVAX at denomination 9
}

const exportTx = {
  txHash: '0xexport',
  timestamp: 1_700_000_000,
  sourceChain: 'c-chain',
  destinationChain: 'p-chain',
  txType: 'ExportTx',
  evmInputs: [{ fromAddress: USER, asset: AVAX_ASSET, credentials: [] }],
  amountUnlocked: [AVAX_ASSET],
  amountCreated: [AVAX_ASSET]
} as unknown as CChainExportTransaction

const importTx = {
  txHash: '0ximport',
  timestamp: 1_700_000_100,
  sourceChain: 'p-chain',
  destinationChain: 'c-chain',
  txType: 'ImportTx',
  evmOutputs: [{ toAddress: USER, asset: AVAX_ASSET }],
  amountUnlocked: [AVAX_ASSET],
  amountCreated: [AVAX_ASSET]
} as unknown as CChainImportTransaction

describe('convertCChainAtomicTransaction', () => {
  it('maps an export as an outgoing AVAX leg leaving the user', () => {
    const tx = convertCChainAtomicTransaction(exportTx, {
      chainId: C_CHAIN_ID,
      explorerUrl: EXPLORER
    })

    expect(tx?.hash).toBe('0xexport')
    expect(tx?.timestamp).toBe(1_700_000_000 * 1000)
    expect(tx?.txType).toBe(PChainTransactionType.EXPORT_TX)
    expect(tx?.chainId).toBe(String(C_CHAIN_ID))
    expect(tx?.isSender).toBe(true)
    expect(tx?.isOutgoing).toBe(true)
    expect(tx?.isIncoming).toBe(false)
    expect(tx?.isContractCall).toBe(false)
    expect(tx?.from).toBe(USER)
    expect(tx?.explorerLink).toBe(`${EXPLORER}/tx/0xexport`)
    expect(tx?.tokens).toHaveLength(1)
    expect(tx?.tokens[0]).toMatchObject({
      type: TokenType.NATIVE,
      symbol: 'AVAX',
      amount: '1.5',
      from: { address: USER }
    })
    expect(tx?.tokens[0]?.amount).not.toContain(',')
  })

  it('maps an import as an incoming AVAX leg arriving at the user', () => {
    const tx = convertCChainAtomicTransaction(importTx, {
      chainId: C_CHAIN_ID,
      explorerUrl: EXPLORER
    })

    expect(tx?.txType).toBe(PChainTransactionType.IMPORT_TX)
    expect(tx?.isSender).toBe(false)
    expect(tx?.isOutgoing).toBe(false)
    expect(tx?.isIncoming).toBe(true)
    expect(tx?.to).toBe(USER)
    expect(tx?.tokens[0]).toMatchObject({
      type: TokenType.NATIVE,
      symbol: 'AVAX',
      amount: '1.5',
      to: { address: USER }
    })
  })

  it('formats a large amount without commas', () => {
    const tx = convertCChainAtomicTransaction(
      {
        ...exportTx,
        amountCreated: [{ ...AVAX_ASSET, amount: '1234500000000' }] // 1234.5 AVAX
      } as unknown as CChainExportTransaction,
      { chainId: C_CHAIN_ID, explorerUrl: EXPLORER }
    )
    expect(tx?.tokens[0]?.amount).toBe('1234.5')
  })

  it('sums multiple created legs of the same asset', () => {
    const tx = convertCChainAtomicTransaction(
      {
        ...exportTx,
        amountCreated: [
          { ...AVAX_ASSET, amount: '1000000000' }, // 1 AVAX
          { ...AVAX_ASSET, amount: '500000000' } // 0.5 AVAX
        ]
      } as unknown as CChainExportTransaction,
      { chainId: C_CHAIN_ID, explorerUrl: EXPLORER }
    )
    expect(tx?.tokens[0]?.amount).toBe('1.5')
    expect(tx?.tokens[0]?.amount).not.toContain(',')
  })

  it('shows the created amount, excluding the atomic export fee on the inputs', () => {
    const tx = convertCChainAtomicTransaction(
      {
        ...exportTx,
        // Consumed on C-Chain (evmInputs / amountUnlocked) = transferred + the
        // atomic export fee (1.501). Created on the destination = 1.5. The row
        // must show the net created amount, not the fee-inclusive input total.
        evmInputs: [
          {
            fromAddress: USER,
            asset: { ...AVAX_ASSET, amount: '1501000000' },
            credentials: []
          }
        ],
        amountUnlocked: [{ ...AVAX_ASSET, amount: '1501000000' }],
        amountCreated: [{ ...AVAX_ASSET, amount: '1500000000' }]
      } as unknown as CChainExportTransaction,
      { chainId: C_CHAIN_ID, explorerUrl: EXPLORER }
    )
    expect(tx?.tokens[0]?.amount).toBe('1.5')
  })

  it('returns null for an export with no evm legs (no phantom row)', () => {
    const tx = convertCChainAtomicTransaction(
      { ...exportTx, evmInputs: [] } as unknown as CChainExportTransaction,
      { chainId: C_CHAIN_ID, explorerUrl: EXPLORER }
    )
    expect(tx).toBeNull()
  })

  it('does not throw when a leg is missing its asset and falls back to 0', () => {
    const convert = (): ReturnType<typeof convertCChainAtomicTransaction> =>
      convertCChainAtomicTransaction(
        {
          ...exportTx,
          // First (primary) leg has no asset, so no primary assetId can be
          // resolved — the created-amount sum finds no matching leg and the
          // amount safely falls back to 0 instead of throwing.
          evmInputs: [
            { fromAddress: USER, credentials: [] },
            {
              fromAddress: USER,
              asset: { ...AVAX_ASSET, amount: '1000000000' }, // 1 AVAX
              credentials: []
            }
          ]
        } as unknown as CChainExportTransaction,
        { chainId: C_CHAIN_ID, explorerUrl: EXPLORER }
      )

    expect(convert).not.toThrow()
    expect(convert()?.tokens[0]?.amount).toBe('0')
  })
})

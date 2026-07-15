import {
  BigIntPr,
  Id,
  Int,
  OutputOwners,
  TransferOutput,
  Utxo,
  avaxSerial,
  utils
} from '@avalabs/avalanchejs'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { Account } from 'store/account'
import AvalancheWalletService from './AvalancheWalletService'
import { SMALL_UTXO_THRESHOLD_NAVAX } from './filterSmallUtxos'

const AVAX_ASSET_ID = Avalanche.MainnetContext.avaxAssetID

const bech32Address = utils.formatBech32('avax', new Uint8Array(20))

let utxoCounter = 0
const mockUtxo = (amount: bigint): Utxo =>
  new Utxo(
    new avaxSerial.UTXOID(Id.fromString(AVAX_ASSET_ID), new Int(utxoCounter++)),
    Id.fromString(AVAX_ASSET_ID),
    new TransferOutput(
      new BigIntPr(amount),
      OutputOwners.fromNative([new Uint8Array(20)])
    )
  )

const account = {
  addressC: '0x0000000000000000000000000000000000000000',
  addressCoreEth: 'C-avax1x0000000000000000000000000000000000',
  addressPVM: 'P-avax1x0000000000000000000000000000000000'
} as Account

const dust = mockUtxo(SMALL_UTXO_THRESHOLD_NAVAX - 1n)
const spendable = mockUtxo(SMALL_UTXO_THRESHOLD_NAVAX)

describe('createSendXTx', () => {
  const baseTX = jest.fn().mockReturnValue('unsigned-tx')

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(AvalancheWalletService, 'getReadOnlySigner').mockResolvedValue({
      getUTXOs: jest
        .fn()
        .mockResolvedValue(new utils.UtxoSet([dust, spendable])),
      baseTX
    } as unknown as Avalanche.AddressWallet)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const params = {
    amountInNAvax: 1n,
    account,
    isTestnet: false,
    destinationAddress: `X-${bech32Address}`,
    sourceAddress: `X-${bech32Address}`,
    xpAddresses: [bech32Address]
  }

  it('drops small UTXOs from the spend set when filterSmallUtxos is true', async () => {
    await AvalancheWalletService.createSendXTx({
      ...params,
      filterSmallUtxos: true
    })

    const { utxoSet } = baseTX.mock.calls[0][0]
    expect(utxoSet.getUTXOs()).toEqual([spendable])
  })

  it('spends the full UTXO set when filterSmallUtxos is not set', async () => {
    await AvalancheWalletService.createSendXTx(params)

    const { utxoSet } = baseTX.mock.calls[0][0]
    expect(utxoSet.getUTXOs()).toEqual([dust, spendable])
  })
})

describe('getSpendableAvaxBalance (X-chain)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(AvalancheWalletService, 'getReadOnlySigner').mockResolvedValue({
      getUTXOs: jest
        .fn()
        .mockResolvedValue(new utils.UtxoSet([dust, spendable]))
    } as unknown as Avalanche.AddressWallet)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const params = {
    chain: 'X' as const,
    account,
    isTestnet: false,
    xpAddresses: [bech32Address]
  }

  it('excludes dust from the spendable balance when filterSmallUtxos is true', async () => {
    const available = await AvalancheWalletService.getSpendableAvaxBalance({
      ...params,
      filterSmallUtxos: true
    })
    expect(available).toBe(SMALL_UTXO_THRESHOLD_NAVAX)
  })

  it('sums the full set when filterSmallUtxos is not set', async () => {
    const available = await AvalancheWalletService.getSpendableAvaxBalance(
      params
    )
    expect(available).toBe(SMALL_UTXO_THRESHOLD_NAVAX * 2n - 1n)
  })
})

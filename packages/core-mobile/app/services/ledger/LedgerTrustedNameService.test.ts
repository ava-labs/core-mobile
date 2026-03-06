import Logger from 'utils/Logger'
import {
  extractSplTransferInfo,
  enrollTrustedName,
  SplTransferInfo
} from './LedgerTrustedNameService'

const SPL_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const SPL_TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'

const MOCK_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const MOCK_DEST_ATA = '7YWbSRgGpxKFrMi7FbBrVnqPfzHnxofbuz8NZgbaELjJ'
const MOCK_OWNER = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy'

jest.spyOn(Logger, 'info').mockImplementation(jest.fn())
jest.spyOn(Logger, 'warn').mockImplementation(jest.fn())

function makeAccount(address: string) {
  return { address }
}

function makeTransferCheckedIx(
  mint: string,
  destATA: string,
  programAddress = SPL_TOKEN_PROGRAM
) {
  return {
    programAddress,
    data: new Uint8Array([12, 0, 0, 0, 0, 0, 0, 0, 0]),
    accounts: [
      makeAccount('sourceATA'),
      makeAccount(mint),
      makeAccount(destATA),
      makeAccount('authority')
    ]
  }
}

function makeCreateATAIx(owner: string, mint: string) {
  return {
    programAddress: ATA_PROGRAM,
    data: new Uint8Array([1]),
    accounts: [
      makeAccount('payer'),
      makeAccount('newATA'),
      makeAccount(owner),
      makeAccount(mint),
      makeAccount('systemProgram'),
      makeAccount('tokenProgram')
    ]
  }
}

describe('extractSplTransferInfo', () => {
  it('returns null when txMessage has no instructions', () => {
    expect(extractSplTransferInfo({})).toBeNull()
    expect(extractSplTransferInfo(null)).toBeNull()
    expect(extractSplTransferInfo(undefined)).toBeNull()
  })

  it('returns null when there is no TransferChecked instruction', () => {
    const txMessage = {
      instructions: [
        {
          programAddress: 'SomeOtherProgram',
          data: new Uint8Array([99]),
          accounts: []
        }
      ]
    }
    expect(extractSplTransferInfo(txMessage)).toBeNull()
  })

  it('extracts info from a simple TransferChecked instruction', () => {
    const txMessage = {
      instructions: [makeTransferCheckedIx(MOCK_MINT, MOCK_DEST_ATA)]
    }

    const result = extractSplTransferInfo(txMessage)
    expect(result).toEqual({
      destATA: MOCK_DEST_ATA,
      mintAddress: MOCK_MINT,
      needsCreateATA: false
    })
  })

  it('works with Token-2022 program', () => {
    const txMessage = {
      instructions: [
        makeTransferCheckedIx(MOCK_MINT, MOCK_DEST_ATA, SPL_TOKEN_2022_PROGRAM)
      ]
    }

    const result = extractSplTransferInfo(txMessage)
    expect(result).toEqual({
      destATA: MOCK_DEST_ATA,
      mintAddress: MOCK_MINT,
      needsCreateATA: false
    })
  })

  it('extracts info with CreateATA instruction', () => {
    const txMessage = {
      instructions: [
        makeCreateATAIx(MOCK_OWNER, MOCK_MINT),
        makeTransferCheckedIx(MOCK_MINT, MOCK_DEST_ATA)
      ]
    }

    const result = extractSplTransferInfo(txMessage)
    expect(result).toEqual({
      destATA: MOCK_DEST_ATA,
      mintAddress: MOCK_MINT,
      ownerAddress: MOCK_OWNER,
      needsCreateATA: true
    })
  })

  it('returns null when TransferChecked has insufficient accounts', () => {
    const txMessage = {
      instructions: [
        {
          programAddress: SPL_TOKEN_PROGRAM,
          data: new Uint8Array([12]),
          accounts: [makeAccount('source')]
        }
      ]
    }
    expect(extractSplTransferInfo(txMessage)).toBeNull()
  })

  it('handles instructions using programId instead of programAddress', () => {
    const txMessage = {
      instructions: [
        {
          programId: { toString: () => SPL_TOKEN_PROGRAM },
          data: new Uint8Array([12, 0, 0, 0, 0, 0, 0, 0, 0]),
          accounts: [
            makeAccount('source'),
            makeAccount(MOCK_MINT),
            makeAccount(MOCK_DEST_ATA),
            makeAccount('authority')
          ]
        }
      ]
    }

    const result = extractSplTransferInfo(txMessage)
    expect(result).toEqual({
      destATA: MOCK_DEST_ATA,
      mintAddress: MOCK_MINT,
      needsCreateATA: false
    })
  })

  it('handles CreateATA with empty data (Create variant)', () => {
    const txMessage = {
      instructions: [
        {
          programAddress: ATA_PROGRAM,
          data: new Uint8Array([]),
          accounts: [
            makeAccount('payer'),
            makeAccount('newATA'),
            makeAccount(MOCK_OWNER),
            makeAccount(MOCK_MINT),
            makeAccount('systemProgram'),
            makeAccount('tokenProgram')
          ]
        },
        makeTransferCheckedIx(MOCK_MINT, MOCK_DEST_ATA)
      ]
    }

    const result = extractSplTransferInfo(txMessage)
    expect(result).toEqual({
      destATA: MOCK_DEST_ATA,
      mintAddress: MOCK_MINT,
      ownerAddress: MOCK_OWNER,
      needsCreateATA: true
    })
  })
})

describe('enrollTrustedName', () => {
  const mockSend = jest.fn().mockResolvedValue(Buffer.from([0x90, 0x00]))
  const mockTransport = {
    send: mockSend,
    deviceModel: { id: 'nanoX' }
  } as unknown as Parameters<typeof enrollTrustedName>[0]

  const mockGetChallenge = jest.fn().mockResolvedValue('0xabc12345')
  const mockProvideTrustedName = jest.fn().mockResolvedValue(true)
  const mockSolanaApp = {
    getChallenge: mockGetChallenge,
    provideTrustedName: mockProvideTrustedName
  } as unknown as Parameters<typeof enrollTrustedName>[1]

  const splInfo: SplTransferInfo = {
    destATA: MOCK_DEST_ATA,
    mintAddress: MOCK_MINT,
    needsCreateATA: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('completes the full enrollment flow for existing ATA', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              descriptor: {
                data: 'aabb',
                signatures: { prod: 'ccdd' }
              }
            }
          ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedDescriptor: 'deadbeef' })
      })

    await enrollTrustedName(mockTransport, mockSolanaApp, splInfo)

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[0]?.[0]).toContain(
      'crypto-assets-service.api.ledger.com/v1/certificates'
    )
    expect(mockFetch.mock.calls[1]?.[0]).toContain(
      `solana/owner/${MOCK_DEST_ATA}`
    )

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockGetChallenge).toHaveBeenCalledTimes(1)
    expect(mockProvideTrustedName).toHaveBeenCalledWith('deadbeef')
  })

  it('uses computed-token-account endpoint for new ATA', async () => {
    const splInfoWithATA: SplTransferInfo = {
      destATA: MOCK_DEST_ATA,
      mintAddress: MOCK_MINT,
      ownerAddress: MOCK_OWNER,
      needsCreateATA: true
    }

    const mockFetch = global.fetch as jest.Mock
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              descriptor: {
                data: 'aabb',
                signatures: { prod: 'ccdd' }
              }
            }
          ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedDescriptor: 'deadbeef' })
      })

    await enrollTrustedName(mockTransport, mockSolanaApp, splInfoWithATA)

    expect(mockFetch.mock.calls[1]?.[0]).toContain(
      `solana/computed-token-account/${MOCK_OWNER}/${MOCK_MINT}`
    )
  })

  it('defaults to nanox when device model cannot be determined', async () => {
    const noModelTransport = {
      send: mockSend
    } as unknown as Parameters<typeof enrollTrustedName>[0]

    const mockFetch = global.fetch as jest.Mock
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              descriptor: {
                data: 'aabb',
                signatures: { prod: 'ccdd' }
              }
            }
          ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ signedDescriptor: 'deadbeef' })
      })

    await enrollTrustedName(noModelTransport, mockSolanaApp, splInfo)

    expect(mockFetch.mock.calls[0]?.[0]).toContain('target_device=nanox')
  })

  it('throws when CAL service returns non-ok', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })

    await expect(
      enrollTrustedName(mockTransport, mockSolanaApp, splInfo)
    ).rejects.toThrow('CAL certificate fetch failed')
  })

  it('does not call provideTrustedName when descriptor is missing', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              descriptor: {
                data: 'aabb',
                signatures: { prod: 'ccdd' }
              }
            }
          ])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

    await enrollTrustedName(mockTransport, mockSolanaApp, splInfo)

    expect(mockProvideTrustedName).not.toHaveBeenCalled()
  })
})

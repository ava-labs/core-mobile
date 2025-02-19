import SeedlessExportService from './SeedlessExportService'
import SeedlessSession from './SeedlessSession'

jest.mock('./SeedlessSession')

const TEST_RESPONSE = {
  a: 1
}

const mockSignerClient = {
  apiClient: {
    userExportInit: jest.fn().mockResolvedValue(TEST_RESPONSE),
    userExportDelete: jest.fn().mockResolvedValue(undefined),
    userExportList: jest.fn().mockReturnValue({
      fetchAll: async () => [TEST_RESPONSE]
    }),
    userExportComplete: jest.fn().mockResolvedValue(TEST_RESPONSE)
  }
}

// @ts-ignore
SeedlessSession.mockImplementation(() => ({
  getSignerClient: jest.fn().mockResolvedValue(mockSignerClient)
}))

const mockUserExportDecrypt = jest.fn()

jest.mock('@cubist-labs/cubesigner-sdk', () => ({
  ...jest.requireActual('@cubist-labs/cubesigner-sdk'),
  userExportDecrypt: jest.fn(() => {
    return mockUserExportDecrypt()
  }),
  userExportKeygen: jest.fn().mockResolvedValue({
    privateKey: 'mock_private_key',
    publicKey: 'mock_public_key'
  })
}))

describe('SeedlessExportService', () => {
  const service = new SeedlessExportService()

  it('userExportInit', async () => {
    const response = await service.userExportInit('key_id')
    expect(response).toEqual(TEST_RESPONSE)
  })

  it('userExportDelete', async () => {
    await expect(service.userExportDelete('key_id')).resolves.toBeUndefined()
  })

  it('userExportList with pending export request', async () => {
    const userExport = await service.userExportList()
    expect(userExport).toEqual(TEST_RESPONSE)
  })

  it('userExportList without pending export request', async () => {
    mockSignerClient.apiClient.userExportList.mockReturnValue({
      fetchAll: async () => []
    })
    const userExport = await service.userExportList()
    expect(userExport).toBeUndefined()
  })

  it('userExportComplete', async () => {
    await expect(
      service.userExportComplete('key_id', 'pub_key' as unknown as CryptoKey)
    ).resolves.toEqual(TEST_RESPONSE)
  })

  it('userExportDecrypt - should fail with missing mnemonic', async () => {
    mockUserExportDecrypt.mockResolvedValue({})
    await expect(
      service.userExportDecrypt('mock_private_key' as unknown as CryptoKey, {
        encrypted_key_material: 'abc',
        ephemeral_public_key: 'def',
        user_id: '1'
      })
    ).rejects.toThrow('userExportDecrypt failed: missing mnemonic')
  })

  it('userExportDecrypt - should succeed with mnemonic', async () => {
    mockUserExportDecrypt.mockResolvedValue({ mnemonic: 'mock_mnemonic' })
    const exportDecrypted = await service.userExportDecrypt(
      'mock_private_key' as unknown as CryptoKey,
      {
        encrypted_key_material: 'abc',
        ephemeral_public_key: 'def',
        user_id: '1'
      }
    )
    expect(exportDecrypted).toBe('mock_mnemonic')
  })
})

// @ts-nocheck
import {
  CubeSignerApi,
  SignerSessionManager,
  UserExportInitResponse
} from '@cubist-labs/cubesigner-sdk'
import SeedlessExportService from './SeedlessExportService'

const MOCK_EXPORT_INIT_RESPONSE: UserExportInitResponse = {
  exp_epoch: 0,
  valid_epoch: 0,
  org_id: 'org_id',
  key_id: 'key_id'
}

jest
  .spyOn(CubeSignerApi.prototype, 'userExportInit')
  // @ts-ignore
  .mockResolvedValue(MOCK_EXPORT_INIT_RESPONSE)

const mockExportList = jest.fn()
jest.spyOn(CubeSignerApi.prototype, 'userExportDelete').mockResolvedValue()
jest
  .spyOn(CubeSignerApi.prototype, 'userExportList')
  .mockImplementation(mockExportList)

jest.spyOn(CubeSignerApi.prototype, 'userExportComplete').mockResolvedValue({})

const mockUserExportDecrypt = jest.fn()
jest.mock('@cubist-labs/cubesigner-sdk', () => ({
  ...jest.requireActual('@cubist-labs/cubesigner-sdk'),
  userExportDecrypt: () => {
    return { mnemonic: '1' }
  }
}))

jest.spyOn(SignerSessionManager, 'loadFromStorage').mockResolvedValue({})

describe('SeedlessExportService', () => {
  const service = new SeedlessExportService()

  it('userExportInit', async () => {
    const response = await service.userExportInit('key_id')
    expect(response).toEqual(MOCK_EXPORT_INIT_RESPONSE)
  })
  it('userExportDelete', async () => {
    try {
      await service.userExportDelete('key_id')
    } catch (e) {
      expect(e).toBeUndefined()
    }
  })
  it('userExportList with pending export request', async () => {
    mockExportList.mockReturnValue({
      fetchAll: async () => [MOCK_EXPORT_INIT_RESPONSE]
    })
    const userExport = await service.userExportList()
    expect(userExport).toEqual(MOCK_EXPORT_INIT_RESPONSE)
  })
  it('userExportList withou pending export request', async () => {
    mockExportList.mockReturnValue({ fetchAll: async () => [] })
    const userExport = await service.userExportList()
    expect(userExport).toBeUndefined()
  })
  it('userExportComplete', async () => {
    try {
      await service.userExportComplete('key_id', 'pub_key')
    } catch (e) {
      expect(e).toBeUndefined()
    }
  })
  it('userExportDecrypt - should fail with missing mnemonic', async () => {
    mockUserExportDecrypt.mockReturnValueOnce({})
    try {
      await service.userExportDecrypt('key_id', {})
    } catch (e) {
      expect((e as Error).message).toBe(
        'userExportDecrypt failed: missing mnemonic'
      )
    }
  })
  it('userExportDecrypt - should fail with missing mnemonica', async () => {
    mockUserExportDecrypt.mockReturnValueOnce({ mnemonic: '1' })
    const exportDecrypted = await service.userExportDecrypt('key_id', {})
    expect(exportDecrypted).toBe('1')
  })
})

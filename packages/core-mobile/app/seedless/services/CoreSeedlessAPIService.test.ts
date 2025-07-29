import { IdentityProof } from '@cubist-labs/cubesigner-sdk'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from './CoreSeedlessAPIService'

const identityProof: IdentityProof = {
  exp_epoch: 0,
  id: 'test'
}
const mockFetch = jest.fn()

describe('CoreSeedlessAPIService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(global, 'fetch').mockImplementation(mockFetch)
  })
  describe('register', () => {
    it('should have returned approved when response status is 200', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ message: 'test' }),
        ok: true,
        status: 200
      })
      const result = await CoreSeedlessAPIService.register(identityProof)
      expect(result).toBe(SeedlessUserRegistrationResult.APPROVED)
    })
    it('should have returned account already registered', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ message: 'USER_ALREADY_EXISTS' }),
        ok: true,
        status: 403
      })
      const result = await CoreSeedlessAPIService.register(identityProof)
      expect(result).toBe(SeedlessUserRegistrationResult.ALREADY_REGISTERED)
    })

    it('should have returned error when status is not 200 nor account is not already registered', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ message: 'test' }),
        ok: true,
        status: 404
      })
      const result = await CoreSeedlessAPIService.register(identityProof)
      expect(result).toBe(SeedlessUserRegistrationResult.ERROR)
    })

    it('should have returned error if register api call threw exception', async () => {
      mockFetch.mockRejectedValue(new Error('test'))
      const result = await CoreSeedlessAPIService.register(identityProof)
      expect(result).toBe(SeedlessUserRegistrationResult.ERROR)
    })
  })

  describe('addAccount', () => {
    it('should not have thrown error when response is ok ', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ message: 'test' }),
        ok: true,
        status: 200
      })
      try {
        await CoreSeedlessAPIService.addAccount({
          identityProof,
          mnemonicId: 'test',
          accountIndex: 0
        })
      } catch (e) {
        expect(e).toBeUndefined()
      }
    })
    it('should have thrown error when response is not ok ', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ message: 'test' }),
        ok: false,
        status: 200
      })
      try {
        await CoreSeedlessAPIService.addAccount({
          identityProof,
          mnemonicId: 'test',
          accountIndex: 0
        })
      } catch (e) {
        expect((e as Error).message).toBe('HTTP 200 - test')
      }
    })
  })
})

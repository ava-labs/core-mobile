import assert from 'assert'
import AuthenticatorService from 'seedless/services/AuthenticatorService'
import { SignResponse, TotpChallenge } from '@cubist-dev/cubesigner-sdk'
import { TotpErrors } from 'seedless/errors'
import SeedlessService from './SeedlessService'

const VALID_MFA_CODE = 'VALID_MFA_CODE'
const INVALID_MFA_CODE = 'INVALID_MFA_CODE'
const mockAnswer: (code: string) => Promise<void> = jest.fn()

const mockTotpChallenge = {
  totpUrl: 'totp_url',
  totpId: 'totp_id',
  answer: mockAnswer
} as TotpChallenge

const cubistResponseNoMfa = {
  requiresMfa(): boolean {
    return false
  },
  data(): TotpChallenge {
    return mockTotpChallenge
  }
} as SignResponse<TotpChallenge>

const cubistResponseHasMfa = {
  requiresMfa(): boolean {
    return true
  },
  data(): TotpChallenge {
    return mockTotpChallenge
  }
} as SignResponse<TotpChallenge>

describe('AuthenticatorService', () => {
  describe('setTotp', () => {
    it('should return the totp challenge url', async () => {
      jest
        .spyOn(SeedlessService, 'resetTotpStart')
        .mockImplementation(async () => {
          return cubistResponseNoMfa
        })

      const result = await AuthenticatorService.setTotp()
      assert(result.success)
      expect(result.value).toBe(mockTotpChallenge.totpUrl)
    })

    it('should return error if there is active mfa', async () => {
      jest
        .spyOn(SeedlessService, 'resetTotpStart')
        .mockImplementation(async () => {
          return cubistResponseHasMfa
        })

      const result = await AuthenticatorService.setTotp()
      assert(!result.success)
      expect(result.error).toBeInstanceOf(TotpErrors)
      expect(result.error.name).toBe('RequiresMfa')
    })

    it('should throw wrong mfa code error from existing mfa', async () => {
      jest
        .spyOn(SeedlessService, 'resetTotpStart')
        .mockImplementation(async () => {
          return cubistResponseNoMfa
        })

      jest.spyOn(SeedlessService, 'verifyTotp').mockImplementation(async () => {
        throw new Error('WrongMfaCode')
      })

      await AuthenticatorService.setTotp()
      const result = await AuthenticatorService.verifyCode(INVALID_MFA_CODE)
      expect(mockAnswer).toHaveBeenCalledWith(INVALID_MFA_CODE)
      assert(!result.success)
      expect(result.error).toBeInstanceOf(TotpErrors)
      expect(result.error.name).toBe('WrongMfaCode')
    })

    it('should require valid code from existing mfa and succeed', async () => {
      jest
        .spyOn(SeedlessService, 'resetTotpStart')
        .mockImplementation(async () => {
          return cubistResponseNoMfa
        })
      jest.spyOn(SeedlessService, 'verifyTotp').mockImplementation()

      await AuthenticatorService.setTotp()
      const result = await AuthenticatorService.verifyCode(VALID_MFA_CODE)
      expect(mockAnswer).toHaveBeenCalledWith(VALID_MFA_CODE)
      assert(result.success)
    })
  })
})

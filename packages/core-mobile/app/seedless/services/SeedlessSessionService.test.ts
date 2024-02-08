import assert from 'assert'
import {
  CubeSignerApi,
  CubeSignerResponse,
  SignerSession,
  TotpChallenge
} from '@cubist-labs/cubesigner-sdk'
import { TotpErrors } from 'seedless/errors'
import SeedlessSessionService from './SeedlessSessionService'
import { SeedlessSessionStorage } from './storage/SeedlessSessionStorage'

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
} as CubeSignerResponse<TotpChallenge>

const cubistResponseHasMfa = {
  requiresMfa(): boolean {
    return true
  },
  data(): TotpChallenge {
    return mockTotpChallenge
  }
} as CubeSignerResponse<TotpChallenge>

const seedlessSessionService = new SeedlessSessionService({
  scopes: ['sign:*'],
  sessionStorage: new SeedlessSessionStorage()
})

describe('SeedlessSessionService', () => {
  jest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .spyOn(seedlessSessionService, 'getCubeSignerClient' as any)
    .mockImplementation(async () => {
      return {
        userTotpResetInit: () => cubistResponseNoMfa
      }
    })
  describe('setTotp', () => {
    it('should return the totp challenge url', async () => {
      const result = await seedlessSessionService.setTotp()
      assert(result.success)
      expect(result.value).toBe(mockTotpChallenge.totpUrl)
    })

    it('should return error if there is active mfa', async () => {
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(seedlessSessionService, 'getCubeSignerClient' as any)
        .mockImplementation(async () => {
          return {
            userTotpResetInit: () => cubistResponseHasMfa
          }
        })

      const result = await seedlessSessionService.setTotp()
      assert(!result.success)
      expect(result.error).toBeInstanceOf(TotpErrors)
      expect(result.error.name).toBe('RequiresMfa')
    })

    it('should throw wrong mfa code error from existing mfa', async () => {
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(seedlessSessionService, 'getCubeSignerClient' as any)
        .mockImplementation(async () => {
          return {
            userTotpResetInit: () => cubistResponseNoMfa
          }
        })
      jest
        .spyOn(CubeSignerApi.prototype, 'userTotpVerify')
        .mockImplementation(async () => {
          throw new Error('WrongMfaCode')
        })

      await seedlessSessionService.setTotp()
      const result = await seedlessSessionService.verifyCode(
        'oidcToken',
        'mfaId',
        INVALID_MFA_CODE
      )
      expect(mockAnswer).toHaveBeenCalledWith(INVALID_MFA_CODE)
      assert(!result.success)
      expect(result.error).toBeInstanceOf(TotpErrors)
      expect(result.error.name).toBe('WrongMfaCode')
    })

    it('should require valid code from existing mfa and succeed', async () => {
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(seedlessSessionService, 'getCubeSignerClient' as any)
        .mockImplementation(async () => {
          return {
            userTotpResetInit: () => cubistResponseNoMfa
          }
        })
      jest.spyOn(SignerSession, 'loadSignerSession').mockReturnValueOnce({
        totpApprove: () => {
          return {
            receipt: {
              confirmation: 'confirmation'
            }
          }
        }
      } as never)

      jest
        .spyOn(seedlessSessionService, 'requestOidcAuth')
        .mockReturnValueOnce('loggedin' as never)

      await seedlessSessionService.setTotp()
      const result = await seedlessSessionService.verifyCode(
        'oidcToken',
        'mfaId',
        VALID_MFA_CODE
      )
      expect(mockAnswer).toHaveBeenCalledWith(VALID_MFA_CODE)
      assert(result.success)
    })
  })
})

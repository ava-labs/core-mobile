import assert from 'assert'
import {
  CubeSignerApi,
  CubeSignerResponse,
  SignerSession,
  TotpChallenge
} from '@cubist-labs/cubesigner-sdk'
import { TotpErrors } from 'seedless/errors'
import SeedlessSessionManager from './SeedlessSessionManager'
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

const seedlessSessionManager = new SeedlessSessionManager({
  scopes: ['manage:mfa', 'sign:*'],
  sessionStorage: new SeedlessSessionStorage()
})

describe('SeedlessSessionManager', () => {
  jest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .spyOn(seedlessSessionManager, 'getCubeSignerClient' as any)
    .mockImplementation(async () => {
      return {
        userTotpResetInit: () => cubistResponseNoMfa
      }
    })
  describe('totpResetInit', () => {
    it('should return the totp challenge url', async () => {
      const response = await seedlessSessionManager.totpResetInit()
      const result = response.data()
      expect(result.totpUrl).toBe(mockTotpChallenge.totpUrl)
    })

    it('should throw wrong mfa code error from existing mfa', async () => {
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(seedlessSessionManager, 'getCubeSignerClient' as any)
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

      const response = await seedlessSessionManager.totpResetInit()
      const challenge = response.data()
      await challenge.answer(INVALID_MFA_CODE)

      const result = await seedlessSessionManager.verifyCode(
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
        .spyOn(seedlessSessionManager, 'getCubeSignerClient' as any)
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
        .spyOn(seedlessSessionManager, 'requestOidcAuth')
        .mockReturnValueOnce('loggedin' as never)

      const response = await seedlessSessionManager.totpResetInit()
      const challenge = response.data()

      await challenge.answer(VALID_MFA_CODE)

      const result = await seedlessSessionManager.verifyCode(
        'oidcToken',
        'mfaId',
        VALID_MFA_CODE
      )
      expect(mockAnswer).toHaveBeenCalledWith(VALID_MFA_CODE)
      assert(result.success)
    })
  })
})

import assert from 'assert'
import {
  ApiClient,
  CubeSignerResponse,
  TotpChallenge
} from '@cubist-labs/cubesigner-sdk'
import { TotpErrors } from 'seedless/errors'
import SeedlessSession from './SeedlessSession'
import { SeedlessSessionManager } from './storage/SeedlessSessionManager'

const VALID_MFA_CODE = 'VALID_MFA_CODE'
const INVALID_MFA_CODE = 'INVALID_MFA_CODE'
const mockAnswer: (code: string) => Promise<void> = jest.fn()

const mockTotpChallenge = {
  url: 'totp_url',
  id: 'totp_id',
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

const seedlessSession = new SeedlessSession({
  scopes: ['manage:mfa', 'sign:*'],
  sessionManager: new SeedlessSessionManager()
})

describe('SeedlessSessionManager', () => {
  jest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .spyOn(seedlessSession, 'getSignerClient' as any)
    .mockImplementation(async () => {
      return {
        resetTotp: () => cubistResponseNoMfa
      }
    })
  describe('totpResetInit', () => {
    it('should return the totp challenge url', async () => {
      const response = await seedlessSession.totpResetInit()
      const result = response.data()
      expect(result.url).toBe(mockTotpChallenge.url)
    })

    it('should throw wrong mfa code error from existing mfa', async () => {
      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(seedlessSession, 'getSignerClient' as any)
        .mockImplementation(async () => {
          return {
            resetTotp: () => cubistResponseNoMfa
          }
        })
      jest
        .spyOn(ApiClient.prototype, 'userTotpVerify')
        .mockImplementation(async () => {
          throw new Error('WrongMfaCode')
        })

      const response = await seedlessSession.totpResetInit()
      const challenge = response.data()
      await challenge.answer(INVALID_MFA_CODE)

      const result = await seedlessSession.verifyCode(
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
        .spyOn(seedlessSession, 'getSignerClient' as any)
        .mockImplementation(async () => {
          return {
            resetTotp: () => cubistResponseNoMfa,
            org: () => ({
              getMfaRequest: () => ({
                totpApprove: () => ({
                  receipt: async () => ({
                    mfaConf: 'confirmation'
                  })
                })
              })
            })
          }
        })

      jest
        .spyOn(seedlessSession, 'requestOidcAuth')
        .mockReturnValueOnce('loggedin' as never)

      const response = await seedlessSession.totpResetInit()
      const challenge = response.data()

      await challenge.answer(VALID_MFA_CODE)

      const result = await seedlessSession.verifyCode(
        'oidcToken',
        'mfaId',
        VALID_MFA_CODE
      )
      expect(mockAnswer).toHaveBeenCalledWith(VALID_MFA_CODE)
      assert(result.success)
    })
  })

  it('should return identity proof', async () => {
    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(seedlessSession, 'oidcProveIdentity' as any)
      .mockResolvedValueOnce({
        exp_epoch: 0,
        id: 'test'
      })

    const result = await seedlessSession.oidcProveIdentity('oidcToken')
    expect(result).toEqual({
      exp_epoch: 0,
      id: 'test'
    })
  })
})

import assert from 'assert'
import AuthenticatorService from 'seedless/AuthenticatorService'
import {
  CognitoSessionManager,
  CubeSigner,
  SignerSession,
  SignerSessionManager,
  SignResponse,
  TotpChallenge
} from '@cubist-dev/cubesigner-sdk'
import Logger from 'utils/Logger'
import { TotpErrors } from 'seedless/errors'

const AUTH_CODE = 'AUTH_CODE'
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
  approveTotp(
    session: SignerSession,
    code: string
  ): Promise<SignResponse<TotpChallenge>> {
    return Promise.resolve(
      code === VALID_MFA_CODE ? cubistResponseNoMfa : cubistResponseHasMfa
    )
  },
  data(): TotpChallenge {
    return mockTotpChallenge
  }
} as SignResponse<TotpChallenge>

jest.spyOn(CubeSigner, 'loadSignerSession').mockImplementation(async () => {
  return {
    sessionMgr: {} as SignerSessionManager
  } as SignerSession
})
jest.spyOn(CubeSigner, 'loadManagementSession').mockImplementation(async () => {
  return {
    sessionMgr: {} as CognitoSessionManager
  } as CubeSigner
})
const promptForCode = jest.fn().mockImplementation(async (totpUrl: string) => {
  Logger.trace('promptForCode', totpUrl)
  //show UI to enter Code
  //await for code enter
  return Promise.resolve({ totpCode: AUTH_CODE })
})

describe('AuthenticatorService', () => {
  let signerSession: SignerSession
  let managementSession: CubeSigner

  beforeEach(async () => {
    signerSession = await CubeSigner.loadSignerSession()
    managementSession = await CubeSigner.loadManagementSession()
  })

  describe('setTotp', () => {
    it('should not require existingTotpCode if there is no active mfa', async () => {
      jest
        .spyOn(CubeSigner.prototype, 'resetTotpStart')
        .mockImplementation(async () => {
          return cubistResponseNoMfa
        })

      const result = await AuthenticatorService.setTotp({
        cognitoSessionManager:
          managementSession.sessionMgr as CognitoSessionManager,
        signerSessionManager: signerSession.sessionMgr,
        totpCodeResolve: promptForCode
      })
      expect(promptForCode).toHaveBeenCalled()
      expect(mockAnswer).toHaveBeenCalledWith(AUTH_CODE)
      assert(result.success)
    })

    it('should require existingTotpCode if there is active mfa', async () => {
      jest
        .spyOn(CubeSigner.prototype, 'resetTotpStart')
        .mockImplementation(async () => {
          return cubistResponseHasMfa
        })

      const result = await AuthenticatorService.setTotp({
        cognitoSessionManager:
          managementSession.sessionMgr as CognitoSessionManager,
        signerSessionManager: signerSession.sessionMgr,
        totpCodeResolve: promptForCode
      })
      assert(!result.success)
      expect(result.error).toBeInstanceOf(TotpErrors)
      expect(result.error.name).toBe('RequiresMfa')
    })

    it('should require valid code from existing mfa', async () => {
      jest
        .spyOn(CubeSigner.prototype, 'resetTotpStart')
        .mockImplementation(async () => {
          return cubistResponseHasMfa
        })

      const result = await AuthenticatorService.setTotp({
        cognitoSessionManager:
          managementSession.sessionMgr as CognitoSessionManager,
        signerSessionManager: signerSession.sessionMgr,
        totpCodeResolve: promptForCode,
        existingTotpCode: INVALID_MFA_CODE
      })
      assert(!result.success)
      expect(result.error).toBeInstanceOf(TotpErrors)
      expect(result.error.name).toBe('WrongMfaCode')
    })

    it('should require valid code from existing mfa and succeed', async () => {
      jest
        .spyOn(CubeSigner.prototype, 'resetTotpStart')
        .mockImplementation(async () => {
          return cubistResponseHasMfa
        })

      const result = await AuthenticatorService.setTotp({
        cognitoSessionManager:
          managementSession.sessionMgr as CognitoSessionManager,
        signerSessionManager: signerSession.sessionMgr,
        totpCodeResolve: promptForCode,
        existingTotpCode: VALID_MFA_CODE
      })
      expect(promptForCode).toHaveBeenCalled()
      expect(mockAnswer).toHaveBeenCalledWith(AUTH_CODE)
      assert(result.success)
    })
  })
})

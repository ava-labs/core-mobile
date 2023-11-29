import Config from 'react-native-config'
import {
  CubeSigner,
  IdentityProof,
  MfaReceipt,
  SignerSessionManager,
  TotpChallenge,
  UserInfo,
  envs,
  Environment,
  SignerSession,
  SignResponse
} from '@cubist-labs/cubesigner-sdk'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { MFA } from 'seedless/types'
import PasskeyService from 'services/passkey/PasskeyService'
import { SeedlessSessionStorage } from './storage/SeedlessSessionStorage'

if (!Config.SEEDLESS_ORG_ID) {
  throw Error('SEEDLESS_ORG_ID is missing. Please check your env file.')
}

if (!Config.SEEDLESS_ENVIRONMENT) {
  throw Error('SEEDLESS_ENVIRONMENT is missing. Please check your env file.')
}

const SEEDLESS_ORG_ID = Config.SEEDLESS_ORG_ID

const SEEDLESS_ENVIRONMENT = Config.SEEDLESS_ENVIRONMENT

const envInterface = envs[SEEDLESS_ENVIRONMENT as Environment]

if (!envInterface) {
  throw Error('SEEDLESS_ENVIRONMENT is incorrect. Please check your env file.')
}

/**
 * Service for cubesigner-sdk
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK
 */
class SeedlessService {
  private totpChallenge?: TotpChallenge
  /**
   * Returns a CubeSigner instance
   */
  private async getCubeSigner(): Promise<CubeSigner> {
    const storage = new SeedlessSessionStorage()
    const sessionMgr = await SignerSessionManager.loadFromStorage(storage)
    return new CubeSigner({
      orgId: SEEDLESS_ORG_ID,
      sessionMgr
    })
  }

  /**
   * Returns a session manager that can be used to retrieve session data.
   */
  private async getSessionManager(): Promise<SignerSessionManager> {
    return (await this.getCubeSigner()).sessionMgr as SignerSessionManager
  }

  /**
   * Exchange an OIDC token for a CubeSigner session with token, mfa session info, etc.
   */
  async login(
    oidcToken: string,
    mfaReceipt?: MfaReceipt | undefined
  ): Promise<SignResponse<unknown>> {
    const signResponse = await new CubeSigner().oidcLogin(
      oidcToken,
      SEEDLESS_ORG_ID,
      ['sign:*', 'manage:*'],
      {
        // How long singing with a particular token works from the token creation
        auth_lifetime: 5 * 60, // 5 minutes
        // How long a refresh token is valid, the user has to unlock Core in this timeframe otherwise they will have to re-login
        // Sessions expire either if the session lifetime expires or if a refresh token expires before a new one is generated
        refresh_lifetime: 90 * 24 * 60 * 60, // 90 days
        // How long till the user absolutely must sign in again
        session_lifetime: 1 * 365 * 24 * 60 * 60 // 1 year
      },
      mfaReceipt
    )

    const sessionResponse = signResponse.requiresMfa()
      ? signResponse.mfaSessionInfo()
      : signResponse.data()

    if (sessionResponse) {
      await SignerSessionManager.createFromSessionInfo(
        envInterface,
        SEEDLESS_ORG_ID,
        sessionResponse,
        new SeedlessSessionStorage()
      )
    }

    return signResponse
  }

  /**
   * Retrieves information about the current user.
   */
  async aboutMe(): Promise<UserInfo> {
    return (await this.getCubeSigner()).aboutMe()
  }

  /**
   * Retrieves information about the current user's mfa.
   */
  async userMfa(): Promise<MFA[]> {
    return (await this.aboutMe()).mfa
  }

  /**
   * setTotp is used to initiate registration of Authenticator app to Cubist.
   * it creates a request to change user's TOTP. This request returns a new TOTP challenge
   * that must be answered by calling resetTotpComplete
   */
  async setTotp(): Promise<Result<string, TotpErrors>> {
    const cubeSigner = await this.getCubeSigner()
    const response = await cubeSigner.resetTotpStart()
    if (response.requiresMfa()) {
      return {
        success: false,
        error: new TotpErrors({
          name: 'RequiresMfa',
          message: 'Registering Authenticator failed, please try again.'
        })
      }
    }
    const challenge = response.data()
    if (!challenge.totpUrl) {
      return {
        success: false,
        error: new TotpErrors({
          name: 'UnexpectedError',
          message: 'Registering Authenticator failed, please try again.'
        })
      }
    }
    this.totpChallenge = challenge
    return { success: true, value: challenge.totpUrl }
  }

  async registerFido(name: string, withSecurityKey: boolean): Promise<void> {
    const cubeSigner = await this.getCubeSigner()
    const signResponse = await cubeSigner.addFidoStart(name)

    const challenge = signResponse.data()

    const credential = await PasskeyService.register(
      challenge.options,
      withSecurityKey
    )

    await challenge.answer(credential)
  }

  async approveFido(
    oidcToken: string,
    mfaId: string,
    withSecurityKey: boolean
  ): Promise<void> {
    const sessionMgr = await this.getSessionManager()
    const signerSession = new SignerSession(sessionMgr)

    const challenge = await signerSession.fidoApproveStart(mfaId)

    const credential = await PasskeyService.authenticate(
      challenge.options,
      withSecurityKey
    )

    const mfaRequestInfo = await challenge.answer(credential)

    if (mfaRequestInfo.receipt?.confirmation) {
      await this.login(oidcToken, {
        mfaOrgId: SEEDLESS_ORG_ID,
        mfaId: mfaId,
        mfaConf: mfaRequestInfo.receipt.confirmation
      })
    } else {
      throw new Error('Passkey authentication failed')
    }
  }

  /**
   * verifyCode is used to verify the code from Authenticator app.
   * and calls resetTotpComplete from totpChallenge.answer() if it is part of the registration flow.
   * registration would fail if totpChallenge.answer() is not called.
   */
  async verifyCode(
    oidcToken: string,
    mfaId: string,
    code: string
  ): Promise<Result<void, TotpErrors>> {
    try {
      await this.totpChallenge?.answer(code)
      this.totpChallenge = undefined

      const mfaSession = await CubeSigner.loadSignerSession(
        new SeedlessSessionStorage()
      )
      const status = await mfaSession.totpApprove(mfaId, code)

      if (!status.receipt?.confirmation) {
        return {
          success: false,
          error: new TotpErrors({
            name: 'WrongMfaCode',
            message: 'WrongMfaCode'
          })
        }
      }

      await this.login(oidcToken, {
        mfaOrgId: SEEDLESS_ORG_ID,
        mfaId: mfaId,
        mfaConf: status.receipt.confirmation
      })

      return { success: true }
    } catch {
      return {
        success: false,
        error: new TotpErrors({
          name: 'WrongMfaCode',
          message: 'WrongMfaCode'
        })
      }
    }
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   * @param oidcToken — The OIDC token
   * @param orgId — The id of the organization that the user is in
   * @return — Proof of authentication
   */
  async oidcProveIdentity(oidcToken: string): Promise<IdentityProof> {
    const cubeSigner = new CubeSigner({
      env: envs.gamma,
      orgId: SEEDLESS_ORG_ID
    })
    return cubeSigner.oidcProveIdentity(oidcToken, SEEDLESS_ORG_ID)
  }
}

export default new SeedlessService()

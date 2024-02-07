import {
  CubeSignerClient,
  CubeSignerResponse,
  Environment,
  IdentityProof,
  MfaFidoChallenge,
  MfaReceipt,
  OidcClient,
  SessionStorage,
  SignerSession,
  SignerSessionData,
  SignerSessionManager,
  TotpChallenge,
  UserInfo,
  envs
} from '@cubist-labs/cubesigner-sdk'
import { hoursToSeconds, minutesToSeconds } from 'date-fns'
import Config from 'react-native-config'
import { TotpErrors } from 'seedless/errors'
import PasskeyService from 'services/passkey/PasskeyService'
import { Result } from 'types/result'
import { MFA } from 'seedless/types'

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

class SeedlessBaseService {
  private totpChallenge?: TotpChallenge
  private scopes: string[]
  protected sessionStorage: SessionStorage<SignerSessionData>

  constructor({
    scopes,
    sessionStorage
  }: {
    scopes: string[]
    sessionStorage: SessionStorage<SignerSessionData>
  }) {
    this.scopes = scopes
    this.sessionStorage = sessionStorage
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   * @param oidcToken — The OIDC token
   * @param orgId — The id of the organization that the user is in
   * @return — Proof of authentication
   * @throws Error in case of network call fail
   */
  async oidcProveIdentity(oidcToken: string): Promise<IdentityProof> {
    const oidcClient = this.getOidcClient(oidcToken)
    return oidcClient.identityProve()
  }

  /**
   * Create a CubeSigner API client for methods that require OIDC authorization.
   *
   * This client can be used to:
   * - obtain a proof of identity (see {@link OidcClient.identityProve})
   * - obtain a full CubeSigner session (see {@link OidcClient.sessionCreate})
   *
   * @param {string} oidcToken The OIDC token to include in 'Authorization' header.
   * @return {OidcClient} CubeSigner API client for methods that require OIDC authorization.
   */
  getOidcClient(oidcToken: string): OidcClient {
    return new OidcClient(envInterface, SEEDLESS_ORG_ID, oidcToken)
  }

  /**
   * Retrieves information about the current user.
   */
  async aboutMe(): Promise<UserInfo> {
    return (await this.getCubeSignerClient()).userGet()
  }

  /**
   * Retrieves information about the current user's mfa.
   */
  async userMfa(): Promise<MFA[]> {
    return (await this.aboutMe()).mfa
  }

  /**
   * Exchange an OIDC token for a CubeSigner session with token, mfa session info, etc.
   */
  async requestOidcAuth(
    oidcToken: string,
    mfaReceipt?: MfaReceipt | undefined
  ): Promise<CubeSignerResponse<SignerSessionData>> {
    const oidcClient = this.getOidcClient(oidcToken)
    const signResponse = await oidcClient.sessionCreate(
      // TODO: reduce the scopes once we have a proper/stable permission system
      // https://ava-labs.atlassian.net/browse/CP-7891
      // ['sign:*', 'manage:*', 'export:*'],
      this.scopes,
      {
        // How long singing with a particular token works from the token creation
        auth_lifetime: minutesToSeconds(5),
        // How long a refresh token is valid, the user has to unlock Core in this timeframe otherwise they will have to re-login
        // Sessions expire either if the session lifetime expires or if a refresh token expires before a new one is generated
        refresh_lifetime: hoursToSeconds(90 * 24),
        // How long till the user absolutely must sign in again
        session_lifetime: hoursToSeconds(365 * 24)
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
        this.sessionStorage
      )
    }

    return signResponse
  }

  /**
   * setTotp is used to initiate registration of Authenticator app to Cubist.
   * it creates a request to change user's TOTP. This request returns a new TOTP challenge
   * that must be answered by calling resetTotpComplete
   */
  async setTotp(): Promise<Result<string, TotpErrors>> {
    const cubeSignerClient = await this.getCubeSignerClient()
    const response = await cubeSignerClient.userTotpResetInit('Core')
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
    const cubeSignerClient = await this.getCubeSignerClient()
    const signResponse = await cubeSignerClient.userFidoRegisterInit(name)

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
    const challenge = await this.fidoApproveStart(mfaId)
    const credential = await PasskeyService.authenticate(
      challenge.options,
      withSecurityKey
    )

    const mfaRequestInfo = await challenge.answer(credential)

    if (mfaRequestInfo.receipt?.confirmation) {
      await this.requestOidcAuth(oidcToken, {
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
  ): Promise<Result<undefined, TotpErrors>> {
    try {
      await this.totpChallenge?.answer(code)
      this.totpChallenge = undefined

      const mfaSession = await SignerSession.loadSignerSession(
        this.sessionStorage
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

      await this.requestOidcAuth(oidcToken, {
        mfaOrgId: SEEDLESS_ORG_ID,
        mfaId: mfaId,
        mfaConf: status.receipt.confirmation
      })

      return { success: true, value: undefined }
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
   * Returns a MfaFidoChallenge that must be answered by calling
   * MfaFidoChallenge.answer or fidoApproveComplete.
   */
  async fidoApproveStart(mfaId: string): Promise<MfaFidoChallenge> {
    const signerSession = new SignerSession(await this.getSessionManager())
    return signerSession.fidoApproveStart(mfaId)
  }

  /**
   * Verify authenticator code
   */
  async verifyApprovalCode<T>(
    cubeSignerResponse: CubeSignerResponse<T>,
    code: string
  ): Promise<Result<CubeSignerResponse<T>, TotpErrors>> {
    const signerSession = await this.getSignerSession()
    const response = await cubeSignerResponse.approveTotp(signerSession, code)
    return { success: true, value: response }
  }

  /**
   * Returns a CubeSigner instance
   */
  private async getCubeSignerClient(): Promise<CubeSignerClient> {
    const sessionManager = await this.getSessionManager()
    return new CubeSignerClient(sessionManager, SEEDLESS_ORG_ID)
  }

  /**
   * Returns a session manager that can be used to retrieve session data.
   */
  private async getSessionManager(): Promise<SignerSessionManager> {
    return await SignerSessionManager.loadFromStorage(this.sessionStorage)
  }

  /**
   * Returns a signer session
   */
  async getSignerSession(): Promise<SignerSession> {
    return new SignerSession(await this.getSessionManager())
  }

  /**
   * Get current cubist environment
   */
  static get environment(): Environment {
    return SEEDLESS_ENVIRONMENT as Environment
  }

  /**
   * Get current cubist org id
   */
  get orgID(): string {
    return SEEDLESS_ORG_ID
  }
}

export default SeedlessBaseService

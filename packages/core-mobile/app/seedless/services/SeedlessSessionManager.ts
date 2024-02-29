import EventEmitter from 'events'
import {
  AddFidoChallenge,
  CubeSignerClient,
  CubeSignerResponse,
  Empty,
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
import { TokenRefreshErrors, TotpErrors } from 'seedless/errors'
import PasskeyService from 'services/passkey/PasskeyService'
import { Result } from 'types/result'
import { MFA } from 'seedless/types'
import Logger from 'utils/Logger'
import { RetryBackoffPolicy, retry } from 'utils/js/retry'

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

class SeedlessSessionManager {
  private scopes: string[]
  private sessionStorage: SessionStorage<SignerSessionData>
  private eventEmitter = new EventEmitter()
  private isTokenValid = false

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
  private getOidcClient(oidcToken: string): OidcClient {
    return new OidcClient(envInterface, SEEDLESS_ORG_ID, oidcToken)
  }

  /**
   * Retrieves information about the current user.
   */
  private async aboutMe(): Promise<UserInfo> {
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

  async refreshToken(): Promise<Result<void, TokenRefreshErrors>> {
    this.setIsTokenValid(false)

    const sessionMgr = await SignerSessionManager.loadFromStorage(
      this.sessionStorage
    ).catch(reason => {
      Logger.error('Failed to load session manager from storage', reason)
      return undefined
    })

    if (!sessionMgr) {
      return {
        success: false,
        error: {
          name: 'RefreshFailed',
          message: 'Failed to load session manager from storage'
        }
      }
    }
    const refreshResult = await retry({
      operation: async _ => {
        return await sessionMgr.refresh().catch(err => {
          //if status is 403 means the token has expired and we need to refresh it

          if ('status' in err && err.status === 403) {
            return {
              success: false,
              error: new TokenRefreshErrors({
                name: 'TokenExpired',
                message: 'Token refresh failed'
              })
            }
          }
          //otherwise propagate error to retry()
          throw err
        })
      },
      backoffPolicy: RetryBackoffPolicy.constant(1),
      isSuccess: result => {
        //stop retry if refresh() passed without problems or we intercepted it in 403 logic
        return result === undefined || 'success' in result
      },
      maxRetries: 10
    }).catch(_ => {
      //if retry() exceeded max retry catch it here
      return {
        success: false,
        error: new TokenRefreshErrors({
          name: 'RefreshFailed',
          message: 'Token refresh failed'
        })
      }
    })

    this.setIsTokenValid(true)

    return (refreshResult || { success: true, value: undefined }) as Result<
      void,
      TokenRefreshErrors
    >
  }

  async totpResetInit(): Promise<CubeSignerResponse<TotpChallenge>> {
    const cubeSignerClient = await this.getCubeSignerClient()

    return await cubeSignerClient.userTotpResetInit('Core')
  }

  async fidoRegisterInit(
    name: string
  ): Promise<CubeSignerResponse<AddFidoChallenge>> {
    const cubeSignerClient = await this.getCubeSignerClient()
    return await cubeSignerClient.userFidoRegisterInit(name)
  }

  async deleteFido(fidoId: string): Promise<CubeSignerResponse<Empty>> {
    const cubeSignerClient = await this.getCubeSignerClient()
    return await cubeSignerClient.userFidoDelete(fidoId)
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
   * Returns the result of signing after MFA approval
   */
  static async signWithMfaApproval<T>(
    response: CubeSignerResponse<T>,
    mfaReceiptConfirmation: string
  ): Promise<CubeSignerResponse<T>> {
    return response.signWithMfaApproval({
      mfaId: response.mfaId(),
      mfaOrgId: SEEDLESS_ORG_ID,
      mfaConf: mfaReceiptConfirmation
    })
  }

  setIsTokenValid(isTokenValid: boolean): void {
    this.isTokenValid = isTokenValid

    this.eventEmitter.emit(
      SeedlessSessionManagerEvent.TokenRefreshed,
      this.isTokenValid
    )
  }

  addListener<T>(
    event: SeedlessSessionManagerEvent,
    callback: (data: T) => void
  ): void {
    this.eventEmitter.on(event, callback)
  }

  removeListener<T>(
    event: SeedlessSessionManagerEvent,
    handler: (data: T) => void
  ): void {
    this.eventEmitter.off(event, handler)
  }
}

export enum SeedlessSessionManagerEvent {
  TokenRefreshed = 'TokenRefreshed'
}

export default SeedlessSessionManager

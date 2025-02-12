import EventEmitter from 'events'
import {
  AddFidoChallenge,
  CubeSignerClient,
  CubeSignerResponse,
  Empty,
  Environment,
  IdentityProof,
  Key,
  KeyInfo,
  MfaFidoChallenge,
  MfaReceipt,
  SessionData,
  // SessionStorage,
  // SignerSession,
  // SignerSessionManager,
  TotpChallenge,
  UserInfo,
  envs,
  ExclusiveSessionManager
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
  Logger.warn('SEEDLESS_ORG_ID is missing. Seedless is disabled.')
}

if (!Config.SEEDLESS_ENVIRONMENT) {
  Logger.warn('SEEDLESS_ENVIRONMENT is missing. Please check your env file.')
}

const SEEDLESS_ORG_ID = Config.SEEDLESS_ORG_ID ?? ''

const SEEDLESS_ENVIRONMENT = Config.SEEDLESS_ENVIRONMENT

const envInterface = envs[SEEDLESS_ENVIRONMENT as Environment]

class SeedlessSessionManager {
  private scopes: string[]
  private sessionManager: ExclusiveSessionManager
  private eventEmitter = new EventEmitter()
  private isTokenValid = false
  private signerClient: CubeSignerClient

  constructor({
    scopes,
    sessionManager
  }: {
    scopes: string[]
    sessionManager: ExclusiveSessionManager
  }) {
    this.scopes = scopes
    this.sessionManager = sessionManager
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   * @param oidcToken — The OIDC token
   * @param orgId — The id of the organization that the user is in
   * @return — Proof of authentication
   * @throws Error in case of network call fail
   */
  async oidcProveIdentity(oidcToken: string): Promise<IdentityProof> {
    return await CubeSignerClient.proveOidcIdentity(
      envInterface,
      SEEDLESS_ORG_ID,
      oidcToken
    )
  }

  /**
   * Retrieves information about the current user.
   */
  private async aboutMe(): Promise<UserInfo> {
    return (await this.getSignerClient()).user()
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
  ): Promise<CubeSignerResponse<SessionData>> {
    return await CubeSignerClient.createOidcSession(
      envInterface,
      SEEDLESS_ORG_ID,
      oidcToken,
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
  }

  async refreshToken(): Promise<Result<void, TokenRefreshErrors>> {
    this.setIsTokenValid(false)

    const refreshResult = await retry({
      operation: async _ => {
        return await this.sessionManager.forceRefresh().catch(err => {
          //if status is 403 means the token has expired and we need to refresh it
          Logger.error('sessionMgr.refresh() failed', err)

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
    const cubeSignerClient = await this.getSignerClient()

    return await cubeSignerClient.resetTotp('Core')
  }

  async fidoRegisterInit(
    name: string
  ): Promise<CubeSignerResponse<AddFidoChallenge>> {
    const cubeSignerClient = await this.getSignerClient()
    return await cubeSignerClient.addFido(name)
  }

  async deleteFido(fidoId: string): Promise<CubeSignerResponse<Empty>> {
    const cubeSignerClient = await this.getSignerClient()
    return await cubeSignerClient.deleteFido(fidoId)
  }

  async approveFido(
    oidcToken: string,
    mfaId: string,
    withSecurityKey: boolean
  ): Promise<void> {
    const challenge = await this.fidoApproveStart(mfaId)
    const credential = await PasskeyService.getCredential(
      challenge.options,
      withSecurityKey
    )

    const mfaRequestInfo = await challenge.answer(credential)
    const mfaReceipt = await mfaRequestInfo.receipt()

    if (mfaReceipt?.mfaConf) {
      await this.requestOidcAuth(oidcToken, {
        mfaOrgId: SEEDLESS_ORG_ID,
        mfaId: mfaId,
        mfaConf: mfaReceipt.mfaConf
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
      const signerClient = await this.getSignerClient()

      const status = await signerClient
        .org()
        .getMfaRequest(mfaId)
        .totpApprove(code)
      const receipt = await status.receipt()

      if (!receipt?.mfaConf) {
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
        mfaConf: receipt.mfaConf
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
    const signerClient = await this.getSignerClient()
    return signerClient.apiClient.mfaFidoInit(mfaId)
  }

  /**
   * Verify authenticator code
   */
  async verifyApprovalCode<T>(
    cubeSignerResponse: CubeSignerResponse<T>,
    code: string
  ): Promise<Result<CubeSignerResponse<T>, TotpErrors>> {
    const signerSession = await this.getSignerClient()
    const response = await cubeSignerResponse.totpApprove(signerSession, code)
    return { success: true, value: response }
  }

  /**
   * Returns a CubeSigner instance
   */
  async getSignerClient(): Promise<CubeSignerClient> {
    if (!this.signerClient) {
      this.signerClient = await CubeSignerClient.create(this.sessionManager)
    }

    return this.signerClient
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
    mfaId: string,
    response: CubeSignerResponse<T>,
    mfaReceiptConfirmation: string
  ): Promise<CubeSignerResponse<T>> {
    return response.execWithMfaApproval({
      mfaId,
      mfaOrgId: SEEDLESS_ORG_ID,
      mfaConf: mfaReceiptConfirmation
    })
  }

  setIsTokenValid(isTokenValid: boolean): void {
    this.isTokenValid = isTokenValid

    this.eventEmitter.emit(
      SeedlessSessionManagerEvent.TokenStatusUpdated,
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

  /**
   * Get Key from keyInfo
   */
  async getKey(keyInfo: KeyInfo): Promise<Key> {
    const client = await this.getSignerClient()
    return new Key(client, keyInfo)
  }
}

export enum SeedlessSessionManagerEvent {
  TokenStatusUpdated = 'TokenStatusUpdated'
}

export default SeedlessSessionManager

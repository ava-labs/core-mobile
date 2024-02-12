import {
  CubeSignerResponse,
  MemorySessionStorage,
  MfaReceipt,
  SignerSessionData,
  UserExportCompleteResponse,
  UserExportInitResponse,
  userExportDecrypt,
  userExportKeygen
} from '@cubist-labs/cubesigner-sdk'
import { UserExportResponse } from 'seedless/types'
import SeedlessSessionManager from './SeedlessSessionManager'

class SeedlessExportService {
  sessionManager = new SeedlessSessionManager({
    scopes: ['export:user', 'manage:export:user', 'manage:mfa:vote'],
    sessionStorage: new MemorySessionStorage<SignerSessionData>()
  })

  /**
   * Initiate user export
   */
  async userExportInit(
    keyId: string,
    mfaReceipt?: MfaReceipt
  ): Promise<CubeSignerResponse<UserExportInitResponse>> {
    const signerSession = await this.sessionManager.getSignerSession()
    return signerSession.userExportInit(keyId, mfaReceipt)
  }

  /**
   * Detele user export
   */
  async userExportDelete(keyId: string, userId?: string): Promise<void> {
    const signerSession = await this.sessionManager.getSignerSession()
    return signerSession.userExportDelete(keyId, userId)
  }

  /**
   * List user export
   */
  async userExportList(): Promise<UserExportInitResponse | undefined> {
    const signerSession = await this.sessionManager.getSignerSession()
    const paginator = signerSession.userExportList()
    const [userExport] = await paginator.fetchAll()
    return userExport
  }

  /**
   * Complete user export
   */
  async userExportComplete(
    keyId: string,
    pubKey: string
  ): Promise<CubeSignerResponse<UserExportCompleteResponse>> {
    const signerSession = await this.sessionManager.getSignerSession()
    return signerSession.userExportComplete(keyId, pubKey)
  }

  /**
   * Decrypt user export's mnemonic
   */
  async userExportDecrypt(
    privateKey: Parameters<typeof userExportDecrypt>[0]['privateKey'],
    response: UserExportCompleteResponse
  ): Promise<string> {
    const exportDecrypted = await userExportDecrypt(privateKey, response)

    const hasMnemonic = 'mnemonic' in exportDecrypted

    if (!hasMnemonic || typeof exportDecrypted.mnemonic !== 'string') {
      throw new Error('userExportDecrypt failed: missing mnemonic')
    }

    return exportDecrypted.mnemonic
  }

  /**
   * Generate key pair for user export
   */
  async userExportGenerateKeyPair(): Promise<
    ReturnType<typeof userExportKeygen>
  > {
    return userExportKeygen()
  }

  /**
   * Returns MFA type
   */
  async getMfaType(): Promise<'totp' | 'fido' | undefined> {
    const signerSession = await this.sessionManager.getSignerSession()
    const identity = await signerSession.identityProve()
    return identity.user_info?.configured_mfa?.[0]?.type
  }

  /**
   * Returns the result of signing after MFA approval
   */
  async signWithMfaApproval(
    userExportResponse: UserExportResponse,
    mfaReceiptConfirmation: string
  ): Promise<UserExportResponse> {
    return userExportResponse.signWithMfaApproval({
      mfaId: userExportResponse.mfaId(),
      mfaOrgId: this.sessionManager.orgID,
      mfaConf: mfaReceiptConfirmation
    })
  }
}

export default SeedlessExportService

import {
  CubeSignerResponse,
  MemorySessionManager,
  MfaReceipt,
  SessionData,
  UserExportCompleteResponse,
  UserExportInitResponse,
  userExportDecrypt,
  userExportKeygen
} from '@cubist-labs/cubesigner-sdk'
import SeedlessSession from './SeedlessSession'

class SeedlessExportService {
  session = new SeedlessSession({
    scopes: ['export:user', 'manage:export:user', 'manage:mfa:vote'],
    // passing null as session data initially
    // user will perform OIDC auth when the export flow starts
    sessionManager: new MemorySessionManager(null as unknown as SessionData)
  })

  /**
   * Initiate user export
   */
  async userExportInit(
    keyId: string,
    mfaReceipt?: MfaReceipt
  ): Promise<CubeSignerResponse<UserExportInitResponse>> {
    const signerSession = await this.session.getSignerClient()
    return signerSession.apiClient.userExportInit(keyId, mfaReceipt)
  }

  /**
   * Detele user export
   */
  async userExportDelete(keyId: string, userId?: string): Promise<void> {
    const signerSession = await this.session.getSignerClient()
    return signerSession.apiClient.userExportDelete(keyId, userId)
  }

  /**
   * List user export
   */
  async userExportList(): Promise<UserExportInitResponse | undefined> {
    const signerSession = await this.session.getSignerClient()
    const paginator = signerSession.apiClient.userExportList()
    const [userExport] = await paginator.fetchAll()
    return userExport
  }

  /**
   * Complete user export
   */
  async userExportComplete(
    keyId: string,
    pubKey: CryptoKey
  ): Promise<CubeSignerResponse<UserExportCompleteResponse>> {
    const signerSession = await this.session.getSignerClient()
    return signerSession.apiClient.userExportComplete(keyId, pubKey)
  }

  /**
   * Decrypt user export's mnemonic
   */
  async userExportDecrypt(
    privateKey: CryptoKey,
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
}

export default SeedlessExportService

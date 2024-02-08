import { SignerSessionManager, KeyInfoApi } from '@cubist-labs/cubesigner-sdk'
import { TokenRefreshErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { retry, RetryBackoffPolicy } from 'utils/js/retry'
import Logger from 'utils/Logger'
import { SeedlessSessionStorage } from './storage/SeedlessSessionStorage'
import SeedlessSessionService from './SeedlessSessionService'

/**
 * Service for cubesigner-sdk
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK
 */
class SeedlessService extends SeedlessSessionService {
  constructor() {
    super({ scopes: ['sign:*'], sessionStorage: new SeedlessSessionStorage() })
  }

  async refreshToken(): Promise<Result<void, TokenRefreshErrors>> {
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

    return (refreshResult || { success: true, value: undefined }) as Result<
      void,
      TokenRefreshErrors
    >
  }

  /**
   * Returns the list of keys that this session has access to.
   */
  async getSessionKeysList(): Promise<KeyInfoApi[]> {
    const signerSession = await this.getSignerSession()
    return signerSession.sessionKeysList()
  }

  /**
   * Returns Mnemonic keys that this session has access to.
   */
  async getMnemonicKeysList(): Promise<KeyInfoApi | undefined> {
    const keysList = await this.getSessionKeysList()
    return keysList.find(k => k.key_type === 'Mnemonic')
  }
}

export default new SeedlessService()

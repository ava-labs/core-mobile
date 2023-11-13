import AuthenticatorService, {
  RequiresMfa
} from 'seedless/AuthenticatorService'
import { CognitoSessionManager } from '@cubist-dev/cubesigner-sdk/dist/src/session/cognito_manager'
import { CubeSigner } from '@cubist-dev/cubesigner-sdk'
import Logger from 'utils/Logger'

describe('AuthenticatorService', () => {
  describe('setTotp', () => {
    it('should be ok', async () => {
      const signerSession = await CubeSigner.loadSignerSession()
      const managementSession = await CubeSigner.loadManagementSession()
      const promptForCode = async (totpUrl: string) => {
        Logger.trace('promptForCode', totpUrl)
        //show UI to enter Code
        //await for code enter
        return Promise.resolve({ totpCode: 'entered code' })
      }

      const result = await AuthenticatorService.setTotp({
        cognitoSessionManager:
          managementSession.sessionMgr as CognitoSessionManager,
        signerSessionManager: signerSession.sessionMgr,
        totpCodeResolve: promptForCode
      })
      expect(result).toBeInstanceOf(RequiresMfa)
    })
  })
})

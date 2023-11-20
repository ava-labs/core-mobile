import { Passkey } from 'react-native-passkey'
import {
  PasskeyRegistrationRequest,
  PasskeyRegistrationResult
} from 'react-native-passkey/lib/typescript/Passkey'

class PasskeyService {
  get isSupported(): boolean {
    return Passkey.isSupported()
  }

  async register(
    request: PasskeyRegistrationRequest
  ): Promise<PasskeyRegistrationResult> {
    try {
      return await Passkey.register(request)
    } catch (error) {
      throw new Error("Couldn't register Passkey: " + error)
    }
  }
}

export default new PasskeyService()

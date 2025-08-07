import { MMKV } from 'react-native-mmkv'
import { uuid } from 'utils/uuid'

const storage = new MMKV({
  id: `user`
})

class UserService {
  static getUniqueID(): string {
    const UNIQUE_ID_KEY = 'USER_SERVICE_UNIQUE_ID'

    let id = storage.getString(UNIQUE_ID_KEY)

    if (!id) {
      id = uuid()
      storage.set(UNIQUE_ID_KEY, id)
    }

    return id
  }
}

export default UserService

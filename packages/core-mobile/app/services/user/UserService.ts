import { StorageKey } from 'resources/Constants'
import { commonStorage } from 'utils/mmkv'
import { uuid } from 'utils/uuid'

class UserService {
  static getUniqueID(): string {
    let id = commonStorage.getString(StorageKey.USER_UNIQUE_ID)

    if (!id) {
      id = uuid()
      commonStorage.set(StorageKey.USER_UNIQUE_ID, id)
    }

    return id
  }
}

export default UserService

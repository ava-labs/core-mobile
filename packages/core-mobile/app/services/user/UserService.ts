import { commonStorage, CommonStorageKeys } from 'utils/mmkv'
import { uuid } from 'utils/uuid'

class UserService {
  static getUniqueID(): string {
    let id = commonStorage.getString(CommonStorageKeys.USER_UNIQUE_ID)

    if (!id) {
      id = uuid()
      commonStorage.set(CommonStorageKeys.USER_UNIQUE_ID, id)
    }

    return id
  }
}

export default UserService

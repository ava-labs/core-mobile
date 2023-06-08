import { getPvmApi } from 'utils/network/pvm'

class EarnService {
  getCurrentValidators = (isTestnet: boolean) => {
    return getPvmApi(isTestnet).getCurrentValidators()
  }
}

export default new EarnService()

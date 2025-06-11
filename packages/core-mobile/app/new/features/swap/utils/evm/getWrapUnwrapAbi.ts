import WAVAX_ABI from '../../../../../contracts/ABI_WAVAX.json'
import WETH_ABI from '../../../../../contracts/ABI_WETH.json'
import { WAVAX_ADDRESS, WETH_ADDRESS } from '../../consts'

export const getWrapUnwrapAbi = (
  tokenAddress: string
): typeof WETH_ABI | typeof WAVAX_ABI | undefined => {
  if (tokenAddress === WETH_ADDRESS) {
    return WETH_ABI
  }
  if (tokenAddress === WAVAX_ADDRESS) {
    return WAVAX_ABI
  }
  return undefined
}

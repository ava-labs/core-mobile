import WAVAX_ABI from '../../../../../contracts/ABI_WAVAX.json'
import WETH_ABI from '../../../../../contracts/ABI_WETH.json'
import { WAVAX_ADDRESS, WETH_ADDRESS } from '../../consts'

export const getWrapUnwrapAbi = (
  tokenAddress: string
): typeof WETH_ABI | typeof WAVAX_ABI | undefined => {
  const addr = tokenAddress.toLowerCase()
  if (addr === WETH_ADDRESS.toLowerCase()) {
    return WETH_ABI
  }
  if (addr === WAVAX_ADDRESS.toLowerCase()) {
    return WAVAX_ABI
  }
  return undefined
}

import { TokenUnit } from '@avalabs/core-utils-sdk'
import { createZustandStore } from 'common/utils/createZustandStore'
import { zeroAvaxPChain } from 'utils/units/zeroValues'

export const useStakeAmount = createZustandStore<TokenUnit>(zeroAvaxPChain())

import { createZustandStore } from 'common/utils/createZustandStore'

export const useTokenAddress = createZustandStore<string>('')

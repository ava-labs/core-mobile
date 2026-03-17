import { createZustandStore } from 'common/utils/createZustandStore'
import { ZustandStorageKeys } from 'resources/Constants'
import { MarketName, MarketNames } from '../types'

const DEFAULT_BORROW_PROTOCOL: MarketName = MarketNames.aave

export const useSelectedBorrowProtocol = createZustandStore<MarketName>(
  DEFAULT_BORROW_PROTOCOL,
  {
    persist: {
      name: ZustandStorageKeys.BORROW_PROTOCOL
    }
  }
)

import { useCallback, useState } from 'react'
import { StorageKey } from 'resources/Constants'
import { commonStorage } from 'utils/mmkv'
import { MarketName, MarketNames } from '../types'

const DEFAULT_BORROW_PROTOCOL: MarketName = MarketNames.aave

export const useBorrowProtocol = (): {
  selectedProtocol: MarketName
  setSelectedProtocol: (protocol: MarketName) => void
} => {
  const [selectedProtocol, setProtocol] = useState<MarketName>(() => {
    const stored = commonStorage.getString(StorageKey.BORROW_PROTOCOL)
    if (stored === MarketNames.aave || stored === MarketNames.benqi) {
      return stored
    }
    return DEFAULT_BORROW_PROTOCOL
  })

  const setSelectedProtocol = useCallback((protocol: MarketName): void => {
    commonStorage.set(StorageKey.BORROW_PROTOCOL, protocol)
    setProtocol(protocol)
  }, [])

  return { selectedProtocol, setSelectedProtocol }
}

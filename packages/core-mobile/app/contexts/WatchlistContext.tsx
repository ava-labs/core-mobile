import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
  Dispatch
} from 'react'

interface WatchlistContextState {
  searchText: string
  setSearchText: Dispatch<string>
}

export const WatchlistContext = createContext<WatchlistContextState>(
  {} as WatchlistContextState
)

export const WatchlistContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const [searchText, setSearchText] = useState('')

  const state: WatchlistContextState = useMemo(
    () => ({
      searchText,
      setSearchText
    }),
    [searchText, setSearchText]
  )

  return (
    <WatchlistContext.Provider value={state}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlistContext(): WatchlistContextState {
  return useContext(WatchlistContext)
}

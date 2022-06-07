import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState
} from 'react'
import { TokenWithBalance } from 'store/balance'

export interface SelectedTokenContextState {
  selectedToken: TokenWithBalance | undefined
  setSelectedToken: Dispatch<SetStateAction<TokenWithBalance | undefined>>
}

export const SelectedTokenContext = createContext<SelectedTokenContextState>(
  {} as any
)

export const SelectedTokenContextProvider = ({
  children
}: {
  children: any
}) => {
  const [selectedToken, setSelectedToken] = useState<
    TokenWithBalance | undefined
  >(undefined)

  const state: SelectedTokenContextState = {
    selectedToken,
    setSelectedToken
  }

  return (
    <SelectedTokenContext.Provider value={state}>
      {children}
    </SelectedTokenContext.Provider>
  )
}

export function useSelectedTokenContext() {
  return useContext(SelectedTokenContext)
}

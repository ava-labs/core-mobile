import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState
} from 'react'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Image, StyleSheet } from 'react-native'
import { TokenWithBalance } from 'store/balance'

export interface SelectedTokenContextState {
  selectedToken: TokenWithBalance | undefined
  setSelectedToken: Dispatch<SetStateAction<TokenWithBalance | undefined>>
  tokenLogo: () => JSX.Element
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

  const tokenLogo = () => {
    if (selectedToken?.symbol === 'AVAX') {
      return <AvaLogoSVG size={32} />
    } else {
      return (
        <Image
          style={styles.tokenLogo}
          source={{
            uri: selectedToken?.logoUri
          }}
        />
      )
    }
  }

  const state: SelectedTokenContextState = {
    selectedToken,
    setSelectedToken,
    tokenLogo
  }

  return (
    <SelectedTokenContext.Provider value={state}>
      {children}
    </SelectedTokenContext.Provider>
  )
}

const styles = StyleSheet.create({
  tokenLogo: {
    paddingHorizontal: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden'
  }
})

export function useSelectedTokenContext() {
  return useContext(SelectedTokenContext)
}

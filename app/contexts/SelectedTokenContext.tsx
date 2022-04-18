import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState
} from 'react'
import { TokenWithBalance } from '@avalabs/wallet-react-components'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Image, StyleSheet } from 'react-native'

export enum TokenType {
  AVAX,
  ERC20,
  ANT
}

export interface SelectedTokenContextState {
  selectedToken: TokenWithBalance | undefined
  setSelectedToken: Dispatch<SetStateAction<TokenWithBalance | undefined>>
  tokenLogo: () => JSX.Element
  tokenType: (token?: TokenWithBalance) => TokenType | undefined
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
    if (selectedToken?.isAvax) {
      return <AvaLogoSVG size={32} />
    } else {
      return (
        <Image
          style={styles.tokenLogo}
          source={{
            uri: selectedToken?.logoURI
          }}
        />
      )
    }
  }

  const tokenType = (token?: TokenWithBalance) => {
    if (token === undefined) {
      return undefined
    } else if (token.isAvax) {
      return TokenType.AVAX
    } else if (token.isErc20) {
      return TokenType.ERC20
    } else if (token.isAnt) {
      return TokenType.ANT
    } else {
      return undefined
    }
  }

  const state: SelectedTokenContextState = {
    selectedToken,
    setSelectedToken,
    tokenLogo,
    tokenType
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

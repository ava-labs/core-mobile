import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import {Image, StyleSheet} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

export interface SelectedTokenContextState {
  selectedToken: TokenWithBalance | undefined;
  setSelectedToken: Dispatch<SetStateAction<TokenWithBalance | undefined>>;
  tokenLogo: () => JSX.Element;
}

export const SelectedTokenContext = createContext<SelectedTokenContextState>(
  {} as any,
);

export const SelectedTokenContextProvider = ({children}: {children: any}) => {
  const [selectedToken, setSelectedToken] = useState<
    TokenWithBalance | undefined
  >(undefined);
  const {theme} = useContext(ApplicationContext);

  const tokenLogo = () => {
    if (selectedToken?.isAvax) {
      return (
        <AvaLogoSVG
          size={32}
          logoColor={theme.white}
          backgroundColor={theme.logoColor}
        />
      );
    } else {
      return (
        <Image
          style={styles.tokenLogo}
          source={{
            uri: selectedToken?.logoURI,
          }}
        />
      );
    }
  };

  const state: SelectedTokenContextState = {
    selectedToken,
    setSelectedToken,
    tokenLogo,
  };
  return (
    <SelectedTokenContext.Provider value={state}>
      {children}
    </SelectedTokenContext.Provider>
  );
};

const styles = StyleSheet.create({
  tokenLogo: {
    paddingHorizontal: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

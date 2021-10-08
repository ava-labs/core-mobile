import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import {ERC20} from '@avalabs/wallet-react-components';
import {AvaxToken} from 'dto/AvaxToken';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import {Image, StyleSheet} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

export interface SelectedTokenContextState {
  selectedToken: ERC20 | AvaxToken | undefined;
  setSelectedToken: Dispatch<SetStateAction<ERC20 | AvaxToken | undefined>>;
  tokenLogo: () => JSX.Element;
}

export const SelectedTokenContext = createContext<SelectedTokenContextState>(
  {} as any,
);

export const SelectedTokenContextProvider = ({children}: {children: any}) => {
  const [selectedToken, setSelectedToken] = useState<
    ERC20 | AvaxToken | undefined
  >(undefined);
  const {theme} = useContext(ApplicationContext);

  const tokenLogo = () => {
    if (selectedToken?.symbol === 'AVAX') {
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
            uri: (selectedToken as ERC20).logoURI,
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

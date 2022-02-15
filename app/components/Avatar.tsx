import React, {FC, useCallback} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import {Erc20Token} from '@avalabs/avalanche-wallet-sdk/dist/Asset';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import AvaText from './AvaText';
import {Opacity10} from 'resources/Constants';

interface Props {
  name: string;
  symbol?: string;
  logoUri?: string;
  showBorder?: boolean;
  size?: number;
}

function isTokenWithBalance(
  token: Erc20Token | TokenWithBalance,
): token is TokenWithBalance {
  return 'logoURI' in token;
}

const AvatarBase: FC<Props> = ({
  name,
  symbol,
  logoUri,
  showBorder,
  size = 32,
}) => {
  const {theme, isDarkMode} = useApplicationContext();
  const hasValidLogoUri =
    logoUri && (logoUri.startsWith('http') || logoUri.startsWith('https'));

  const tokenLogo = useCallback(() => {
    // if AVAX, return our own logo
    if (symbol === 'AVAX') {
      return (
        <AvaLogoSVG
          size={size}
          logoColor={theme.white}
          backgroundColor={theme.logoColor}
        />
      );
    }

    // if ERC20 or invalid URL, return token initials
    if (!hasValidLogoUri) {
      const names = (name ?? '').split(' ');
      const initials =
        names.length > 1
          ? names[0].substring(0, 1) + names[names.length - 1].substring(0, 1)
          : names[0].substring(0, 1);

      return (
        <View
          style={[
            styles.initials,
            {
              backgroundColor: isDarkMode
                ? theme.colorStroke2 + Opacity10
                : theme.white,
              width: size,
              height: size,
            },
            showBorder && {borderWidth: 0.5, borderColor: theme.colorDisabled},
          ]}>
          <AvaText.Body1>{initials}</AvaText.Body1>
        </View>
      );
      // if TokenWithBalance and valid URI get load it.
    } else {
      return (
        <Image
          style={styles.tokenLogo}
          source={{uri: logoUri!}}
          width={size}
          height={size}
        />
      );
    }
  }, [logoUri]);

  return tokenLogo();
};

interface TokenAvatarProps {
  token: Erc20Token | TokenWithBalance;
  size?: number;
}
const TokenAvatar: FC<TokenAvatarProps> = ({token, size}) => {
  const isErc20Token = !isTokenWithBalance(token);
  const name = token.name;
  const symbol = token.symbol;
  const logoUri = isErc20Token
    ? undefined
    : (token as TokenWithBalance).logoURI;

  return (
    <AvatarBase name={name} symbol={symbol} logoUri={logoUri} size={size} />
  );
};

const CustomAvatar: FC<Props> = props => {
  return <AvatarBase {...props} />;
};

const Avatar = {
  Token: TokenAvatar,
  Custom: CustomAvatar,
};

const styles = StyleSheet.create({
  tokenLogo: {
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  initials: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Avatar;

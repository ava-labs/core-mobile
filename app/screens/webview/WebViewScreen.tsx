import React, {FC} from 'react';
import WebView from 'react-native-webview';

interface Props {
  url: string;
}

const LEGAL_URL = 'https://wallet.avax.network/legal';

const WebViewScreen: FC<Props> = ({url = LEGAL_URL}) => {
  return <WebView source={{uri: url}} />;
};

export default WebViewScreen;

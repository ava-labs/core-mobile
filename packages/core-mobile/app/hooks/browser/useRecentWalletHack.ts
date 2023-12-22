export type RecentWalletHackScripts = {
  injectedJavascript: string
  /**
   * Use injectLogRecentWallet if you need to find out what is stored in localStorage under WCM_RECENT_WALLET_DATA key.
   * To use it put this string into WebView.injectedJavaScript, and watch for messages in WebView.onMessage
   */
  injectLogRecentWallet: string
}

export type InjectedJavascriptReturnType = {
  favicon: string
  description: string
  recentWallet: string
}

/**
 * This hook offers js scripts to be injected into WebView so that WalletConnect modal window shows our
 * app on top of the list.
 * The way it works is by putting stringified JSON into setting localStorage of visited website under WCM_RECENT_WALLET_DATA
 * key. This data is read by
 * [WalletConnect modal]{@link https://github.com/WalletConnect/modal/blob/95571fb4e96bd2a5c36214e657dc66aae0f1c8b4/packages/modal-ui/src/utils/UiUtil.ts#L146}
 * and it sets this wallet as first in the list of supported wallets.
 */
export default function useRecentWalletHack(): RecentWalletHackScripts {
  const coreMobileWalletConnectObject = `
    {
      id: 'f323633c1f67055a45aac84e321af6ffe46322da677ffdd32f9bc1e33bafe29c',
      name: 'Core',
      homepage:
        'https://core.app/?utm_source=referral&utm_medium=website&utm_campaign=walletconnect',
      image_id: '35f9c46e-cc57-4aa7-315d-e6ccb2a1d600',
      order: 3230,
      app: {
        browser: null,
        ios: 'https://apps.apple.com/us/app/core-crypto-wallet-nfts/id6443685999',
        android:
          'https://play.google.com/store/apps/details?id=com.avaxwallet&hl=en_US&gl=US',
        mac: null,
        windows: null,
        linux: null,
        chrome:
          'https://chrome.google.com/webstore/detail/core-crypto-wallet-nft-ex/agoakfejjabomempkjlepdflaleeobhb',
        firefox: null,
        safari: null,
        edge: null,
        opera: null
      },
      injected: [
        {
          injected_id: 'isAvalanche',
          namespace: 'eip155'
        }
      ],
      rdns: null,
      mobile: {
        native: 'core://',
        universal: 'https://core.app'
      },
      desktop: {
        native: null,
        universal: null
      }
    };
  `

  // inject Core as recent wallet
  // grab favicon and description from html
  const injectedJavascript = `(async function(){ 
    const wallet = ${coreMobileWalletConnectObject}
    window.localStorage.setItem('WCM_RECENT_WALLET_DATA', JSON.stringify(wallet));
    const recentWallet = window.localStorage.getItem('WCM_RECENT_WALLET_DATA');

    let description = '';
    let favicon = 'null';
    const metas = document.getElementsByTagName('meta');
    for (let i = 0; i < metas.length; i++) {
      if (metas[i].getAttribute('name') === 'description') {
        description = metas[i].getAttribute('content');
      }
    }
    var nodeList = document.getElementsByTagName("link");
    for (var i = 0; i < nodeList.length; i++) {
      if (nodeList[i].getAttribute("rel") === "apple-touch-icon" && favicon === "null") {
        favicon = nodeList[i].getAttribute("href");
      } else if (nodeList[i].getAttribute("rel") === "shortcut icon" && favicon === "null") {
        favicon = nodeList[i].getAttribute("href");
      } else if (nodeList[i].getAttribute("rel") === "icon shortcut" && favicon === "null") {
        favicon = nodeList[i].getAttribute("href");
      } else if (nodeList[i].getAttribute("rel") === "icon" && favicon === "null") {
        favicon = nodeList[i].getAttribute("href");
      }
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({favicon, description, recentWallet}));
  })();`

  const injectLogRecentWallet = `(async function(){
    let printRecentWallet = async function(){
      const recentWallet = window.localStorage.getItem('WCM_RECENT_WALLET_DATA');
      window.ReactNativeWebView.postMessage(recentWallet)
      await new Promise(r => setTimeout(r, 2000));
    }
    while (true){
      await printRecentWallet();
    }
  })();`

  return {
    injectedJavascript,
    injectLogRecentWallet
  }
}

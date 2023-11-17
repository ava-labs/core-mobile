export type RecentWalletHackScripts = {
  injectCoreAsRecent: string
  /**
   * Use injectMetamaskAsRecent only for testing or demo
   */
  injectMetamaskAsRecent: string
  /**
   * Use injectLogRecentWallet if you need to find out what is stored in localStorage under WCM_RECENT_WALLET_DATA key.
   * To use it put this string into WebView.injectedJavaScript, and watch for messages in WebView.onMessage
   */
  injectLogRecentWallet: string
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

  const metamaskWalletConnectObject = `
    {
      id: 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
      name: 'MetaMask',
      homepage: 'https://metamask.io/',
      image_id: '5195e9db-94d8-4579-6f11-ef553be95100',
      order: 10,
      app: {
        browser: null,
        ios: 'https://apps.apple.com/us/app/metamask/id1438144202',
        android: 'https://play.google.com/store/apps/details?id=io.metamask',
        mac: null,
        windows: null,
        linux: null,
        chrome:
          'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
        firefox: 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/',
        safari: null,
        edge: 'https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm?hl=en-US',
        opera: 'https://addons.opera.com/en-gb/extensions/details/metamask-10/'
      },
      injected: [
        {
          injected_id: 'isMetaMask',
          namespace: 'eip155'
        }
      ],
      rdns: 'io.metamask',
      mobile: {
        native: 'metamask://',
        universal: 'https://metamask.app.link'
      },
      desktop: {
        native: null,
        universal: null
      }
    };
  `

  const injectCoreAsRecent = `(async function(){ 
    const wallet = ${coreMobileWalletConnectObject}
    window.localStorage.setItem('WCM_RECENT_WALLET_DATA', JSON.stringify(wallet));
    const recentWallet = window.localStorage.getItem('WCM_RECENT_WALLET_DATA');
    window.ReactNativeWebView.postMessage(recentWallet)
  })();`

  const injectMetamaskAsRecent = `(async function(){ 
    const wallet = ${metamaskWalletConnectObject}
    window.localStorage.setItem('WCM_RECENT_WALLET_DATA', JSON.stringify(wallet));
    const recentWallet = window.localStorage.getItem('WCM_RECENT_WALLET_DATA');
    window.ReactNativeWebView.postMessage(recentWallet)
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
    injectCoreAsRecent,
    injectMetamaskAsRecent,
    injectLogRecentWallet
  }
}

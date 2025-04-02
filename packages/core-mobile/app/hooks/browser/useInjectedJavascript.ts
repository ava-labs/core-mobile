import { BlockchainNamespace } from '@avalabs/core-chains-sdk'
import { ImageStyle, TextStyle, ViewStyle } from 'react-native'

export type InjectedJavascripts = {
  injectCoreAsRecent: string
  /**
   * Use injectLogRecentWallet if you need to find out what is stored in localStorage under WCM_RECENT_WALLET_DATA key.
   * To use it put this string into WebView.injectedJavaScript, and watch for messages in WebView.onMessage
   */
  coreConnectInterceptor: string
  injectLogRecentWallet: string
  injectCustomWindowOpen: string
  injectCustomPrompt: string
  injectGetDescriptionAndFavicon: string
  injectGetPageStyles: string
}

export type InjectedJsMessageWrapper = {
  method:
    | 'window_ethereum_used'
    | 'recent_wallet'
    | 'desc_and_favicon'
    | 'page_styles'
    | 'log'
    | 'walletConnect_deeplink_blocked'
  payload: string
}

export type GetDescriptionAndFavicon = {
  favicon: string
  description: string
}

export type GetPageStyles = {
  backgroundColor: string
  color: string
  fontSize: string
  fontFamily: string
}

/**
 * This hook offers js scripts to be injected into WebView so that WalletConnect modal window shows our
 * app on top of the list.
 * The way it works is by putting stringified JSON into setting localStorage of visited website under WCM_RECENT_WALLET_DATA
 * key. This data is read by
 * [WalletConnect modal]{@link https://github.com/WalletConnect/modal/blob/95571fb4e96bd2a5c36214e657dc66aae0f1c8b4/packages/modal-ui/src/utils/UiUtil.ts#L146}
 * and it sets this wallet as first in the list of supported wallets.
 */
export function useInjectedJavascript(): InjectedJavascripts {
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
          namespace: ${BlockchainNamespace.EIP155},
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
  const injectCoreAsRecent = `(async function(){ 
    const wallet = ${coreMobileWalletConnectObject}
    window.localStorage.setItem('WCM_RECENT_WALLET_DATA', JSON.stringify(wallet));
  })();`

  const injectLogRecentWallet = `(async function(){
    let printRecentWallet = async function(){
      const recentWallet = window.localStorage.getItem('WCM_RECENT_WALLET_DATA');
      const message = {
        method: 'recent_wallet',
        payload: recentWallet
      }
      window.ReactNativeWebView.postMessage(JSON.stringify(message))
      await new Promise(r => setTimeout(r, 2000));
    }
    while (true){
      await printRecentWallet();
    }
  })();`

  // inject favicon and description from html link tags and meta tags
  const injectGetDescriptionAndFavicon = `(async function(){ 
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

    const message = {
        method: 'desc_and_favicon',
        payload: JSON.stringify({favicon, description})
      }
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  })();`

  const injectGetPageStyles = `(async function(){ 
    setTimeout(() => {
      const styles = getComputedStyle(document.body)
      
      const message = {
        method: 'page_styles',
        payload: JSON.stringify({
          backgroundColor: styles?.backgroundColor, 
          color: styles?.color, 
          fontSize: styles?.fontSize, 
          fontFamily: styles?.fontFamily,
        })
      }
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }, 100);
  })();
  `

  const coreConnectInterceptor = `(async function(){     
    setTimeout(() => {
      let notified = false;
      const request = async function (json) {
        if (!notified && window.hasInteracted) {
          const message = {
            method: 'window_ethereum_used',
            payload: json
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
          notified = true;
        }
        return Promise.reject(new Error('not implemented'));
      };
      if (!window.ethereum) {
        window.ethereum = {};
      }
      window.ethereum.request = request;
      window.ethereum.enable = request;
      window.ethereum.on = function (eventName, f){ return true; }
      const message = {
        method: 'log',
        payload: 'coreConnectInterceptor ok!'
      };
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }, 500); //add delay to make sure we don't get overridden by something else
  })();`

  // blocks dapp redirects to walletconnect deeplinks
  // after walletConnect sent a session request
  const injectCustomWindowOpen = `(async function(){
    const originalWindowOpen = window.open;
    window.open = function(url, target, features){
      if (url.startsWith('core://wc?requestId')){
        const message = {
          method: 'walletConnect_deeplink_blocked',
          payload: url
        };
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
        return null;
      }
      return originalWindowOpen(url, target, features);
    }
  })();`

  /**
   * Caution, the coreConnectInterceptor function depends on window.hasInteracted which is manipulated here
   */
  const injectCustomPrompt = `(async function(){
    var focused = false;
    Object.freeze(Object);
    window.onfocus = function(){
      focused = true;
      window.hasInteracted = true;
    };
    window.onblur = function(){
      focused = false;
    };
    const origPrompt = window.prompt;
    const customPrompt = function(message){
      if (focused){
        return origPrompt(message);
      } else {
        return '';
      }
    };
    const origAlert = window.alert;
    const customAlert = function(message){
      if (focused){
        return origAlert(message);
      } else {
        return;
      }
    };
    const origConfirm = window.confirm;
    const customConfirm = function(message){
      if (focused){
        return origConfirm(message);
      } else {
        return false;
      }
    };
    Object.defineProperty(window, 'prompt', {
      value: customPrompt,
      writable: false,
      configurable: false
    });
    Object.defineProperty(window, 'alert', {
      value: customPrompt,
      writable: false,
      configurable: false
    });
    Object.defineProperty(window, 'confirm', {
      value: customPrompt,
      writable: false,
      configurable: false
    });
  })();`

  return {
    injectCoreAsRecent,
    injectLogRecentWallet,
    injectGetDescriptionAndFavicon,
    coreConnectInterceptor,
    injectCustomWindowOpen,
    injectCustomPrompt,
    injectGetPageStyles
  }
}

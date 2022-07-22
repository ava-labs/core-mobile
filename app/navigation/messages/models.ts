export enum MessageType {
  SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  SIGN_TYPED_DATA_V1 = 'eth_signTypedData_v1',
  SIGN_TYPED_DATA = 'eth_signTypedData',
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN = 'eth_sign'
}

export enum DEEPLINKS {
  ORIGIN_DEEPLINK = 'deeplink',
  ORIGIN_QR_CODE = 'qr-code'
}

export const ETH_ACTIONS = {
  TRANSFER: 'transfer',
  APPROVE: 'approve'
}

export const PROTOCOLS = {
  HTTP: 'http',
  HTTPS: 'https',
  WC: 'wc',
  ETHEREUM: 'ethereum',
  DAPP: 'dapp',
  METAMASK: 'metamask'
}

export const ACTIONS = {
  DAPP: 'dapp',
  SEND: 'send',
  APPROVE: 'approve',
  PAYMENT: 'payment',
  FOCUS: 'focus',
  EMPTY: '',
  WC: 'wc'
}

export const PREFIXES = {
  [ACTIONS.DAPP]: 'https://',
  [ACTIONS.SEND]: 'ethereum:',
  [ACTIONS.APPROVE]: 'ethereum:',
  [ACTIONS.FOCUS]: '',
  [ACTIONS.EMPTY]: ''
}

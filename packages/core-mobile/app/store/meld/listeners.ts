import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { selectTokensWithBalanceForAccount } from 'store/balance'
import { Account, selectActiveAccount } from 'store/account'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import NetworkService from 'services/network/NetworkService'
import { selectNetwork } from 'store/network'
import Logger from 'utils/Logger'
import {
  NetworkTokenWithBalance,
  NetworkVMType,
  TokenWithBalance,
  TokenWithBalanceSVM
} from '@avalabs/vm-module-types'
import { send as sendEVM } from 'common/hooks/send/utils/evm/send'
import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal,
  SolanaProvider
} from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { send as sendSVM } from 'common/hooks/send/utils/svm/send'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { send as sendBTC } from 'common/hooks/send/utils/btc/send'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import { dismissMeldStack } from 'features/meld/utils'
import { ACTIONS } from 'contexts/DeeplinkContext/types'
import { RequestContext } from 'store/rpc'
import { Request } from 'store/rpc/utils/createInAppRequest'
import MeldService from 'features/meld/services/MeldService'
import {
  offrampActivityIndicatorStore,
  offrampSessionIdStore
} from 'features/meld/store'
import { TokenType } from '@avalabs/vm-module-types'
import { closeInAppBrowser } from 'utils/openInAppBrowser'
import { retry } from 'utils/js/retry'
import { showAlert } from '@avalabs/k2-alpine'
import { MeldTransaction } from 'features/meld/types'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { selectIsEnableMeldSandboxBlocked } from 'store/posthog/slice'
import { HyperSDKClient } from 'hypersdk-client'
import { offrampSend } from './slice'

const handleOfframpSend = async (
  searchParams: URLSearchParams,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const isSandboxBlocked = selectIsEnableMeldSandboxBlocked(state)
  const request = createInAppRequest(dispatch)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const activeAccount = selectActiveAccount(state)
  const sessionId = offrampSessionIdStore.getState().sessionId
  const { setAnimating } = offrampActivityIndicatorStore.getState()

  if (sessionId === undefined) {
    Logger.error('sessionId is undefined')
    return
  }

  let response: MeldTransaction | undefined
  // fetch transaction by session id with max 2 retries
  try {
    response = await retry({
      operation: () => {
        return MeldService.fetchTrasactionBySessionId({
          sessionId,
          sandbox: !isSandboxBlocked
        })
      },
      shouldStop: result => result?.transaction !== undefined,
      maxRetries: 2
    })
  } catch (error) {
    Logger.error('failed to fetch transaction by session id', { error })
    closeInAppBrowser()
    showAlert({
      title: 'Unable to retrieve your off-ramp transaction',
      description:
        'We had trouble retrieving your off-ramp transaction. This might be a connection issue — please try again. If the problem persists, some providers may require you to cancel the existing transaction before starting a new one.',
      buttons: [
        {
          text: 'Got it',
          style: 'default'
        }
      ]
    })
    setAnimating(false)
    return
  }

  const symbol =
    response?.transaction?.serviceProviderDetails?.details.cryptoCurrency ??
    undefined

  const chainId = getChainId(
    symbol,
    response?.transaction?.cryptoDetails?.chainId ?? undefined
  )

  const destinationWalletAddress =
    response?.transaction?.cryptoDetails?.destinationWalletAddress ?? undefined
  const sourceAmount = response?.transaction?.sourceAmount ?? undefined

  const network = response?.transaction?.cryptoDetails?.chainId
    ? selectNetwork(Number(chainId))(state)
    : undefined

  const tokens = selectTokensWithBalanceForAccount(state, activeAccount?.id)
  const token = tokens.find(
    tk =>
      (tk.symbol === symbol && tk.networkChainId === Number(chainId)) ||
      // the solana chain id from meld is 101, and our chain id for solana is 4503599627369476, so we only want to check
      // if it is native token type and if the symbol matches
      ((symbol === 'SOL' || symbol === 'BTC') &&
        tk.symbol === symbol &&
        tk.type === TokenType.NATIVE)
  )

  if (
    network === undefined ||
    token === undefined ||
    activeAccount === undefined ||
    destinationWalletAddress === undefined ||
    sourceAmount === undefined ||
    chainId === undefined
  ) {
    Logger.error('missing required parameters', { chainId })
    return
  }

  const decimals = getDecimals(token, network)

  const amountTokenUnit = new TokenUnit(
    Number(sourceAmount) * 10 ** decimals,
    decimals,
    token.symbol
  )

  const provider = await NetworkService.getProviderForNetwork(network)

  try {
    setAnimating(true)
    closeInAppBrowser()
    const txHash = await handleSend({
      vmName: network.vmName,
      request,
      activeAccount,
      destinationWalletAddress,
      amountTokenUnit,
      chainId: Number(chainId),
      provider,
      token,
      network,
      isDeveloperMode
    })
    if (txHash) {
      dismissMeldStack(ACTIONS.OfframpCompleted, searchParams)
    }
  } catch (error) {
    Logger.error('error completing offramp transaction', { error })
  } finally {
    setAnimating(false)
  }
}

const handleSend = async ({
  vmName,
  request,
  activeAccount,
  destinationWalletAddress,
  amountTokenUnit,
  chainId,
  provider,
  token,
  network,
  isDeveloperMode
}: {
  vmName: NetworkVMType
  request: Request
  activeAccount: Account
  destinationWalletAddress: string
  amountTokenUnit: TokenUnit
  chainId: number
  provider:
    | JsonRpcBatchInternal
    | BitcoinProvider
    | Avalanche.JsonRpcProvider
    | HyperSDKClient
    | SolanaProvider
  token: TokenWithBalance
  network: Network
  isDeveloperMode: boolean
}): Promise<string | undefined> => {
  let txHash: string | undefined

  switch (vmName) {
    case NetworkVMType.EVM: {
      txHash = await sendEVM({
        request,
        fromAddress: activeAccount.addressC,
        chainId,
        provider: provider as JsonRpcBatchInternal,
        token: token as NetworkTokenWithBalance,
        toAddress: destinationWalletAddress,
        amount: amountTokenUnit.toSubUnit(),
        context: {
          [RequestContext.CONFETTI_DISABLED]: true
        }
      })
      break
    }
    case NetworkVMType.SVM: {
      txHash = await sendSVM({
        request,
        fromAddress: activeAccount.addressSVM,
        chainId,
        provider: provider as SolanaProvider,
        token: token as TokenWithBalanceSVM,
        toAddress: destinationWalletAddress,
        amount: amountTokenUnit.toSubUnit(),
        account: activeAccount,
        context: {
          [RequestContext.CONFETTI_DISABLED]: true
        }
      })
      break
    }
    case NetworkVMType.BITCOIN: {
      const networkFee = await NetworkFeeService.getNetworkFee(network)
      txHash = await sendBTC({
        request,
        fromAddress: activeAccount.addressBTC,
        toAddress: destinationWalletAddress,
        amount: amountTokenUnit.toSubUnit(),
        feeRate: networkFee?.low.maxFeePerGas,
        isMainnet: !isDeveloperMode,
        context: {
          [RequestContext.CONFETTI_DISABLED]: true
        }
      })
      break
    }
  }

  return txHash
}

const getChainId = (
  symbol?: string,
  meldChainId?: string
): number | undefined => {
  if (symbol === 'SOL') {
    return ChainId.SOLANA_MAINNET_ID
  }
  return meldChainId ? Number(meldChainId) : undefined
}

const getDecimals = (token: TokenWithBalance, network: Network): number => {
  return token.type === TokenType.NATIVE ||
    token.type === TokenType.ERC20 ||
    token.type === TokenType.SPL
    ? token.decimals
    : network.networkToken.decimals
}

export const addMeldListeners = (startListening: AppStartListening): void => {
  startListening({
    actionCreator: offrampSend,
    effect: async (action, listenerApi) =>
      handleOfframpSend(action.payload.searchParams, listenerApi)
  })
}

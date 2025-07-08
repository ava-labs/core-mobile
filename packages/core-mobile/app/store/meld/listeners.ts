import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { selectTokensWithBalanceForAccount } from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import NetworkService from 'services/network/NetworkService'
import { selectNetwork } from 'store/network'
import Logger from 'utils/Logger'
import {
  NetworkTokenWithBalance,
  NetworkVMType,
  TokenWithBalanceSVM
} from '@avalabs/vm-module-types'
import { send as sendEVM } from 'common/hooks/send/utils/evm/send'
import { JsonRpcBatchInternal, SolanaProvider } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { send as sendSVM } from 'common/hooks/send/utils/svm/send'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { send as sendBTC } from 'common/hooks/send/utils/btc/send'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import { dismissMeldStack } from 'features/meld/utils'
import { ACTIONS } from 'contexts/DeeplinkContext/types'
import { RequestContext } from 'store/rpc'
import MeldService from 'features/meld/services/MeldService'
import { offrampSessionIdStore } from 'features/meld/store'
import { TokenType } from '@avalabs/vm-module-types'
import { offrampSend } from './slice'

const handleOfframpSend = async (
  searchParams: URLSearchParams,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const request = createInAppRequest(dispatch)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const activeAccount = selectActiveAccount(state)
  const sessionId = offrampSessionIdStore.getState().sessionId

  if (sessionId === undefined) {
    Logger.error('sessionId is undefined')
    return
  }

  // fetch transaction by session id
  const response = await MeldService.fetchTrasactionBySessionId({
    sessionId
  })

  const chainId = response?.transaction?.cryptoDetails?.chainId ?? undefined
  const destinationWalletAddress =
    response?.transaction?.cryptoDetails?.destinationWalletAddress ?? undefined
  const sourceAmount = response?.transaction?.sourceAmount ?? undefined
  const symbol =
    response?.transaction?.serviceProviderDetails?.details.cryptoCurrency ??
    undefined

  const network = response?.transaction?.cryptoDetails?.chainId
    ? selectNetwork(Number(chainId))(state)
    : undefined

  const tokens = selectTokensWithBalanceForAccount(state, activeAccount?.id)
  const token = tokens.find(
    tk => tk.symbol === symbol && tk.networkChainId === Number(chainId)
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

  const decimals =
    token.type === TokenType.NATIVE ||
    token.type === TokenType.ERC20 ||
    token.type === TokenType.SPL
      ? token.decimals
      : network.networkToken.decimals

  const amountTokenUnit = new TokenUnit(
    Number(sourceAmount) * 10 ** decimals,
    decimals,
    token.symbol
  )

  const provider = await NetworkService.getProviderForNetwork(network)

  let txHash: string | undefined

  switch (network.vmName) {
    case NetworkVMType.EVM: {
      txHash = await sendEVM({
        request,
        fromAddress: activeAccount.addressC,
        chainId: Number(chainId),
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
        chainId: Number(chainId),
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
  if (txHash) {
    dismissMeldStack(ACTIONS.OfframpCompleted, searchParams)
  }
}

export const addMeldListeners = (startListening: AppStartListening): void => {
  startListening({
    actionCreator: offrampSend,
    effect: async (action, listenerApi) =>
      handleOfframpSend(action.payload.searchParams, listenerApi)
  })
}

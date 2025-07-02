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
import { offrampSend } from './slice'

const handleOfframpSend = async (
  searchParams: URLSearchParams,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const cryptoAmount = searchParams.get('cryptoAmount') ?? undefined
  const walletAddress = searchParams.get('walletAddress') ?? undefined
  const chainId = searchParams.get('chainId') ?? undefined
  const network = chainId ? selectNetwork(Number(chainId))(state) : undefined
  const request = createInAppRequest(dispatch)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const activeAccount = selectActiveAccount(state)
  const tokens = selectTokensWithBalanceForAccount(state, activeAccount?.id)
  const token = tokens.find(tk => tk.networkChainId === Number(chainId))

  if (
    network === undefined ||
    token === undefined ||
    activeAccount === undefined ||
    walletAddress === undefined ||
    cryptoAmount === undefined ||
    chainId === undefined
  ) {
    Logger.error('missing required parameters', { chainId })
    return
  }

  const amountTokenUnit = new TokenUnit(
    Number(cryptoAmount) * 10 ** network.networkToken.decimals,
    network.networkToken.decimals,
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
        toAddress: walletAddress,
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
        toAddress: walletAddress,
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
        toAddress: walletAddress,
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

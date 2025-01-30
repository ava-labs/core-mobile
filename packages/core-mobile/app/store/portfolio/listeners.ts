import { AppListenerEffectAPI } from 'store'
import { Balances, setBalances } from 'store/balance'
import { AppStartListening } from 'store/middleware/listener'
import { isTokenMalicious } from 'utils/isTokenMalicious'
import { selectTokenVisilibity, turnOffTokenVisibility } from './slice'

const updateTokenVisibility = async (
  listenerApi: AppListenerEffectAPI,
  balances: Balances
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const tokenVisibility = selectTokenVisilibity(state)
  const balance = Object.values(balances)
  const tokens = balance.flatMap(b => b.tokens)

  tokens.forEach(token => {
    // set default token visibility to false for malicious tokens
    if (
      isTokenMalicious(token) &&
      tokenVisibility[token.localId] === undefined
    ) {
      dispatch(turnOffTokenVisibility(token.localId))
    }
  })
}

export const addPortfolioListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: setBalances,
    effect: async (action, listenerApi) => {
      updateTokenVisibility(listenerApi, action.payload)
    }
  })
}

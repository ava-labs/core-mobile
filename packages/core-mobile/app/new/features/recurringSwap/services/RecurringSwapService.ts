import Logger from 'utils/Logger'
import type {
  IRecurringSwapService,
  RecurringQuoteParams,
  RecurringQuoteResult,
  RecurringSwapParams,
  WrappedTx
} from './types'

type Deps = {
  baseUrl: string
  bearerToken: string
  fetch?: typeof fetch
}

const MARKR_NUMBER_OF_ORDERS_CAP = 365

export class RecurringSwapService implements IRecurringSwapService {
  readonly #baseUrl: string
  readonly #bearerToken: string
  readonly #fetch: typeof fetch

  constructor({ baseUrl, bearerToken, fetch: fetchImpl = fetch }: Deps) {
    this.#baseUrl = baseUrl.replace(/\/$/, '')
    this.#bearerToken = bearerToken
    this.#fetch = fetchImpl
  }

  async recurringQuote(params: RecurringQuoteParams): Promise<RecurringQuoteResult> {
    // Markr caps numberOfOrders at 365; the UI's "Unlimited" sentinel is
    // Infinity. Clamp here so the service is the single place that knows.
    const numberOfOrders = Number.isFinite(params.numberOfOrders)
      ? Math.min(params.numberOfOrders as number, MARKR_NUMBER_OF_ORDERS_CAP)
      : MARKR_NUMBER_OF_ORDERS_CAP

    const body = {
      appId: params.appId,
      chainId: params.chainId,
      tokenIn: params.tokenIn,
      tokenInDecimals: params.tokenInDecimals,
      tokenOut: params.tokenOut,
      tokenOutDecimals: params.tokenOutDecimals,
      amount: params.amount,
      numberOfOrders,
      frequency: params.frequency,
      slippage: params.slippageBps
    }

    return this.#post<RecurringQuoteResult>('/recurring/quote', body)
  }

  async recurringSwap(params: RecurringSwapParams): Promise<WrappedTx> {
    return this.#post<WrappedTx>('/recurring/swap', params)
  }

  async #post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.#bearerToken}`
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const errBody = await this.#tryReadJson(res)
      const errorText =
        errBody !== null &&
        errBody !== undefined &&
        typeof errBody === 'object' &&
        'error' in errBody
          ? String((errBody as Record<string, unknown>).error)
          : undefined
      const message = errorText ?? `Request failed with status ${res.status}`
      Logger.error(`[RecurringSwapService] ${path} failed`, {
        status: res.status,
        body: errBody
      })
      throw new Error(message)
    }

    return (await res.json()) as T
  }

  async #tryReadJson(res: Response): Promise<unknown> {
    try {
      return await res.json()
    } catch {
      return undefined
    }
  }
}

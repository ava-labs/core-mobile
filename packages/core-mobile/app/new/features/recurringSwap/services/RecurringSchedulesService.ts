import type { Schedule, ScheduleStatus } from '../types'

export type ListSchedulesParams = {
  address: string
  chainId?: number
  status?: ScheduleStatus
}

export type CancelScheduleParams = {
  orderId: string
  address: string
}

export type RecurringSchedulesError =
  | { kind: 'not_cancellable'; message: string }
  | { kind: 'not_found'; message: string }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'network'; cause: unknown }

type Deps = {
  baseUrl: string
  bearerToken: string
  fetch?: typeof fetch
}

export class RecurringSchedulesService {
  readonly #baseUrl: string
  readonly #bearerToken: string
  readonly #fetch: typeof fetch

  constructor({ baseUrl, bearerToken, fetch: f }: Deps) {
    this.#baseUrl = baseUrl.replace(/\/$/, '')
    this.#bearerToken = bearerToken
    this.#fetch = f ?? fetch
  }

  async list(params: ListSchedulesParams): Promise<Schedule[]> {
    const qs = new URLSearchParams()
    qs.set('address', params.address)
    if (params.chainId !== undefined) qs.set('chainId', String(params.chainId))
    if (params.status !== undefined) qs.set('status', params.status)

    const res = await this.#fetch(`${this.#baseUrl}/recurring/orders?${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.#bearerToken}` }
    })
    if (res.status === 401) {
      const e: RecurringSchedulesError = {
        kind: 'unauthorized',
        message: 'Bearer expired'
      }
      throw e
    }
    if (!res.ok) throw new Error(`recurring/orders ${res.status}`)
    const body = (await res.json()) as { orders: Schedule[] }
    return body.orders
  }

  async cancel(params: CancelScheduleParams): Promise<Schedule> {
    const res = await this.#fetch(
      `${this.#baseUrl}/recurring/orders/${params.orderId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.#bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: params.address })
      }
    )
    if (res.status === 200) return (await res.json()) as Schedule
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    if (res.status === 400) {
      const e: RecurringSchedulesError = {
        kind: 'not_cancellable',
        message: body.error ?? 'Order is not cancellable'
      }
      throw e
    }
    if (res.status === 404) {
      const e: RecurringSchedulesError = {
        kind: 'not_found',
        message: 'Order not found for this address'
      }
      throw e
    }
    if (res.status === 401) {
      const e: RecurringSchedulesError = {
        kind: 'unauthorized',
        message: 'Bearer expired'
      }
      throw e
    }
    throw new Error(`recurring/cancel ${res.status}`)
  }
}

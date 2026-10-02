import {
  DeviceActionStatus,
  type DeviceActionState
} from '@ledgerhq/device-management-kit'
import { filter, firstValueFrom, type Observable } from 'rxjs'
import { describeDmkError } from './describeDmkError'

/**
 * Runs a Device Management Kit device action to completion.
 *
 * A device action emits Pending for each step it reports, then exactly one of
 * Completed / Error / Stopped. Awaiting the observable directly
 * (`firstValueFrom(action.observable)`) therefore resolves with the first
 * Pending state and never with the output, which reads as a failure before the
 * device has done anything. Only the terminal emission carries the result, so
 * it has to be filtered for.
 *
 * Resolves with the action's output, or throws naming the terminal status.
 */
export const runDeviceAction = async <Output>(
  action: {
    observable: Observable<DeviceActionState<Output, unknown, unknown>>
  },
  call: string
): Promise<Output> => {
  const result = await firstValueFrom(
    action.observable.pipe(
      filter(
        state =>
          state.status === DeviceActionStatus.Completed ||
          state.status === DeviceActionStatus.Error ||
          state.status === DeviceActionStatus.Stopped
      )
    )
  )

  if (result.status === DeviceActionStatus.Completed) {
    return result.output
  }

  if (result.status === DeviceActionStatus.Error) {
    throw new Error(
      `Ledger ${call} failed: ${describeDmkError(result.error)}`,
      {
        cause: result.error
      }
    )
  }

  throw new Error(`Ledger ${call} did not complete: ${result.status}`)
}

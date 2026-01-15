import { ApprovalResponse } from '@avalabs/vm-module-types'
import { providerErrors, rpcErrors } from '@metamask/rpc-errors'

export const onReject = ({
  resolve,
  message
}: {
  resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
  message?: string
}): void => {
  const error = message
    ? rpcErrors.internal(message)
    : providerErrors.userRejectedRequest()

  resolve({
    error
  })
}

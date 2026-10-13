import { PChainTransaction, PChainTransactionType } from '@avalabs/glacier-sdk'
import { isDelegationTx } from './isDelegationTx'

const makeTx = (txType: PChainTransactionType): PChainTransaction =>
  ({ txType } as PChainTransaction)

describe('isDelegationTx', () => {
  it.each([
    PChainTransactionType.ADD_DELEGATOR_TX,
    PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX
  ])('returns true for %s', txType => {
    expect(isDelegationTx(makeTx(txType))).toBe(true)
  })

  it.each([
    PChainTransactionType.ADD_VALIDATOR_TX,
    PChainTransactionType.ADD_PERMISSIONLESS_VALIDATOR_TX,
    PChainTransactionType.IMPORT_TX,
    PChainTransactionType.EXPORT_TX
  ])('returns false for %s', txType => {
    expect(isDelegationTx(makeTx(txType))).toBe(false)
  })
})

import { AcceptedTypes, TokenUnit } from '@avalabs/core-utils-sdk'

export class AvaxXP extends TokenUnit {
  private constructor(value: AcceptedTypes) {
    super(value, 9, 'AVAX')
  }

  static fromNanoAvax(value: AcceptedTypes): AvaxXP {
    return new AvaxXP(value)
  }

  toNanoAvax(): bigint {
    return super.toSubUnit()
  }
}

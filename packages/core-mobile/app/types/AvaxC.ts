import { AcceptedTypes, TokenUnit } from '@avalabs/core-utils-sdk'

export class AvaxC extends TokenUnit {
  private constructor(value: AcceptedTypes) {
    super(value, 18, 'AVAX')
  }

  static fromWei(value: AcceptedTypes): AvaxC {
    return new AvaxC(value)
  }

  toWei(): bigint {
    return super.toSubUnit()
  }
}

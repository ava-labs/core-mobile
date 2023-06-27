import { Avax, Hour, MainnetParams, MegaAvax } from 'utils/NetworkParams'
import { bnToBig } from '@avalabs/utils-sdk'
import EarnService from 'services/earn/EarnService'

describe('calcReward', () => {
  it('should return zero if current supply is max', () => {
    expect(
      EarnService.calcReward(
        bnToBig(Avax.muln(25)),
        7 * 24 * Hour,
        bnToBig(MainnetParams.stakingConfig.RewardConfig.SupplyCap),
        2,
        true
      )
    ).toEqual('0')
  })
  it('should return non zero if current supply is less than max', () => {
    expect(
      EarnService.calcReward(
        bnToBig(Avax.muln(2000000)),
        7 * 24 * Hour,
        bnToBig(MegaAvax.muln(400)),
        2,
        true
      )
    ).toEqual('3018657459186')
  })
})

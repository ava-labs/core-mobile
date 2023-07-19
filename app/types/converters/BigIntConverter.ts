import { BigIntNAvax, BigIntWeiAvax } from 'types/denominations'

class BigIntConverter {
  weiToNAvax(source: BigIntWeiAvax) {
    return (source / BigInt(1e9)) as BigIntNAvax
  }
}

export default new BigIntConverter()

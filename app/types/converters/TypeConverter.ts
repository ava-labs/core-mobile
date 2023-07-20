import BN from 'bn.js'

class TypeConverter {
  bnToBigInt(source: BN) {
    return BigInt(source.toString())
  }
}

export default new TypeConverter()

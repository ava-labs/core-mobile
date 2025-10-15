package com.margelo.nitro.nitroavalabscrypto
  
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class NitroAvalabsCrypto : HybridNitroAvalabsCryptoSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}

#pragma once

#include "HybridCryptoSpec.hpp"          // your generated spec
#include <secp256k1.h>
// Schnorr / xonly
#include <secp256k1_schnorrsig.h>
#include <secp256k1_extrakeys.h>

#include <array>
#include <cstdint>
#include <memory>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>
#include <variant>
#include <vector>

namespace margelo::nitro::nitroavalabscrypto {

class CryptoHybrid final : public HybridCryptoSpec {
public:
  // Per your spec’s note: explicitly call HybridObject(TAG) in ctor
  CryptoHybrid() : HybridObject(TAG) {}
  ~CryptoHybrid() override = default;
    
  typedef std::variant<std::shared_ptr<ArrayBuffer>, std::string> BufferOrString;

  // ---- Spec methods ----
  std::shared_ptr<ArrayBuffer> getPublicKey(
      const std::variant<std::string, int64_t, std::shared_ptr<ArrayBuffer>>& secretKey,
      std::optional<bool> isCompressed);

  std::shared_ptr<ArrayBuffer> getPublicKeyFromString(const std::string& secretKey, std::optional<bool> isCompressed) override;
  std::shared_ptr<ArrayBuffer> getPublicKeyFromArrayBuffer(const std::shared_ptr<ArrayBuffer>& secretKey, std::optional<bool> isCompressed) override;
  std::shared_ptr<ArrayBuffer> pointAddScalar(
    const BufferOrString& publicKey,
    const BufferOrString& tweak,
    std::optional<bool> isCompressed) override;

  std::shared_ptr<ArrayBuffer> sign(
    const BufferOrString& secretKey,
    const BufferOrString& message) override;

  bool verify(
    const BufferOrString& publicKey,
    const BufferOrString& message,
    const BufferOrString& signature) override;

  std::shared_ptr<ArrayBuffer> signSchnorr(
  const BufferOrString& secretKey,
  const BufferOrString& messageHash,
  const BufferOrString& auxRand
  ) override;

  bool verifySchnorr(
    const BufferOrString& publicKey,
    const BufferOrString& messageHash,
    const BufferOrString& signature) override;

  ExtendedPublicKey getExtendedPublicKey(
    const BufferOrString& secretKey) override;


protected:
  // If your nitrogen requires it, you can override loadHybridMethods(),
  // but the base already wires methods based on the spec.

private:
  // context singleton
  static secp256k1_context* ctx();

  // helpers
  static std::vector<uint8_t> hexToBytes(const std::string& hex);
  static std::vector<uint8_t> bytesFromVariant(const BufferOrString& v);
  static std::array<uint8_t,32> require32(const BufferOrString& v, const char* what);
  static std::vector<uint8_t> serializePubkey(const secp256k1_pubkey& pk, bool compressed);
  static secp256k1_pubkey parsePubkey(const std::vector<uint8_t>& in);
  static std::shared_ptr<ArrayBuffer> toAB(const std::vector<uint8_t>& v);
};

} // namespace margelo::nitro::nitroavalabscrypto

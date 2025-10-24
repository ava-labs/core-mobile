#pragma once

#include "HybridCryptoSpec.hpp"          // your generated spec
#include "XOnlyTweakResult.hpp"
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

  // ---- Spec methods ----
  std::shared_ptr<ArrayBuffer> getPublicKey(
      const std::variant<std::string, int64_t, std::shared_ptr<ArrayBuffer>>& secretKey,
      std::optional<bool> isCompressed);

  std::shared_ptr<ArrayBuffer> getPublicKeyFromString(const std::string& secretKey, std::optional<bool> isCompressed) override;
  std::shared_ptr<ArrayBuffer> getPublicKeyFromArrayBuffer(const std::shared_ptr<ArrayBuffer>& secretKey, std::optional<bool> isCompressed) override;
  std::shared_ptr<ArrayBuffer> pointAddScalar(
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& publicKey,
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& tweak,
    std::optional<bool> isCompressed) override;

  // X-only tweak add (returns x-only result or null)
  std::optional<XOnlyTweakResult> xOnlyPointAddTweak(
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& xOnly,
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& tweak) override;

  // X-only tweak add returning a full pubkey (33/65) or null
  std::optional<std::shared_ptr<ArrayBuffer>> pointAddScalarXOnly(
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& xOnly,
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& tweak,
    std::optional<bool> isCompressed) override;

  std::shared_ptr<ArrayBuffer> sign(
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& secretKey,
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& message) override;

  bool verify(
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& publicKey,
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& message,
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& signature) override;

  std::shared_ptr<ArrayBuffer> signSchnorr(
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& secretKey,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& messageHash,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& auxRand
  ) override;

  bool verifySchnorr(
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& publicKey,
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& messageHash,
    const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& signature) override;


protected:
  // If your nitrogen requires it, you can override loadHybridMethods(),
  // but the base already wires methods based on the spec.

private:
  // context singleton
  static secp256k1_context* ctx();

  // helpers
  static std::vector<uint8_t> hexToBytes(const std::string& hex);
  static std::vector<uint8_t> bytesFromVariant(const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& v);
  static std::array<uint8_t,32> require32(const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& v, const char* what);
  static std::vector<uint8_t> serializePubkey(const secp256k1_pubkey& pk, bool compressed);
  static secp256k1_pubkey parsePubkey(const std::vector<uint8_t>& in);
  static std::shared_ptr<ArrayBuffer> toAB(const std::vector<uint8_t>& v);
};

} // namespace margelo::nitro::nitroavalabscrypto
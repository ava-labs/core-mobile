#include "CryptoHybrid.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <algorithm>
#include <cctype>
#include <stdexcept>
#ifdef __ANDROID__
#include <android/log.h>
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "CryptoHybrid", __VA_ARGS__)
#else
#define LOGI(...)
#endif

static std::string toHex(const uint8_t* p, size_t n) {
  static const char* k = "0123456789abcdef";
  std::string s; s.resize(n*2);
  for (size_t i=0;i<n;i++){ s[2*i]=k[p[i]>>4]; s[2*i+1]=k[p[i]&0xF]; }
  return s;
}

namespace margelo::nitro::nitroavalabscrypto {

namespace {
  std::once_flag g_once;
  secp256k1_context* g_ctx = nullptr;

  inline uint8_t hexNibble(char c) {
    if (c >= '0' && c <= '9') return static_cast<uint8_t>(c - '0');
    c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    if (c >= 'a' && c <= 'f') return static_cast<uint8_t>(10 + (c - 'a'));
    throw std::invalid_argument("Invalid hex character");
  }
}

secp256k1_context* CryptoHybrid::ctx() {
  std::call_once(g_once, [] {
    g_ctx = secp256k1_context_create(SECP256K1_CONTEXT_VERIFY | SECP256K1_CONTEXT_SIGN);
    // optional randomization (not strictly required)
    unsigned char seed[32] = {0};
    (void)secp256k1_context_randomize(g_ctx, seed);
  });
  return g_ctx;
}

std::vector<uint8_t> CryptoHybrid::hexToBytes(const std::string& h) {
  std::string hex = h;
  if (hex.rfind("0x", 0) == 0 || hex.rfind("0X", 0) == 0) hex.erase(0, 2);
  if (hex.size() % 2 != 0) throw std::invalid_argument("Hex string must have even length");
  std::vector<uint8_t> out(hex.size()/2);
  for (size_t i=0;i<out.size();++i) {
    out[i] = static_cast<uint8_t>((hexNibble(hex[2*i]) << 4) | hexNibble(hex[2*i+1]));
  }
  return out;
}

std::vector<uint8_t> CryptoHybrid::bytesFromVariant(const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& v) {
  if (std::holds_alternative<std::string>(v)) {
    return hexToBytes(std::get<std::string>(v));
  } else {
    const auto& ab = std::get<std::shared_ptr<ArrayBuffer>>(v);
    if (!ab) throw std::invalid_argument("ArrayBuffer is null");
    auto* p = reinterpret_cast<const uint8_t*>(ab->data());
    return std::vector<uint8_t>(p, p + ab->size());
  }
}

std::array<uint8_t,32> CryptoHybrid::require32(const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& v, const char* what) {
  auto bytes = bytesFromVariant(v);
  if (bytes.size() != 32) {
    throw std::invalid_argument(std::string(what) + " must be 32 bytes");
  }
  std::array<uint8_t,32> out{};
  std::copy(bytes.begin(), bytes.end(), out.begin());
  return out;
}

secp256k1_pubkey CryptoHybrid::parsePubkey(const std::vector<uint8_t>& in) {
  secp256k1_pubkey pk{};
  // Accept 33 (compressed) or 65 (uncompressed)
  if (in.size() != 33 && in.size() != 65) {
    throw std::invalid_argument("Public key must be 33 or 65 bytes");
  }
  if (secp256k1_ec_pubkey_parse(ctx(), &pk, in.data(), in.size()) != 1) {
    throw std::invalid_argument("Invalid public key bytes");
  }
  return pk;
}

std::vector<uint8_t> CryptoHybrid::serializePubkey(const secp256k1_pubkey& pk, bool compressed) {
  size_t len = compressed ? 33 : 65;
  std::vector<uint8_t> out(len);
  unsigned int flags = compressed ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED;
  if (secp256k1_ec_pubkey_serialize(ctx(), out.data(), &len, &pk, flags) != 1) {
    throw std::runtime_error("Failed to serialize public key");
  }
  out.resize(len);
  return out;
}

std::shared_ptr<ArrayBuffer> CryptoHybrid::toAB(const std::vector<uint8_t>& v) {
  auto ab = ArrayBuffer::allocate(v.size());
  std::memcpy(ab->data(), v.data(), v.size());
  return ab;
}

/* ---------- getPublicKey* (ECDSA-style pubkey from 32-byte seckey) ---------- */

std::shared_ptr<ArrayBuffer> CryptoHybrid::getPublicKeyFromString(const std::string& secretKey, std::optional<bool> isCompressed) {
  auto sk = hexToBytes(secretKey);
  if (sk.size() != 32) throw std::invalid_argument("secretKey must be 32 bytes hex");
  bool comp = isCompressed.value_or(true);

  secp256k1_pubkey pk{};
  if (secp256k1_ec_seckey_verify(ctx(), sk.data()) != 1)
    throw std::invalid_argument("Invalid secret key");
  if (secp256k1_ec_pubkey_create(ctx(), &pk, sk.data()) != 1)
    throw std::runtime_error("secp256k1_ec_pubkey_create failed");

  return toAB(serializePubkey(pk, comp));
}

std::shared_ptr<ArrayBuffer> CryptoHybrid::getPublicKeyFromArrayBuffer(const std::shared_ptr<ArrayBuffer>& secretKey, std::optional<bool> isCompressed) {
  if (!secretKey) throw std::invalid_argument("secretKey ArrayBuffer is null");
  if (secretKey->size() != 32) throw std::invalid_argument("secretKey must be 32 bytes");
  bool comp = isCompressed.value_or(true);

  const auto* sk = reinterpret_cast<const uint8_t*>(secretKey->data());
  if (secp256k1_ec_seckey_verify(ctx(), sk) != 1)
    throw std::invalid_argument("Invalid secret key");

  secp256k1_pubkey pk{};
  if (secp256k1_ec_pubkey_create(ctx(), &pk, sk) != 1)
    throw std::runtime_error("secp256k1_ec_pubkey_create failed");

  return toAB(serializePubkey(pk, comp));
}

/* ------------------------ pointAddScalar: P + t·G ------------------------- */

std::shared_ptr<ArrayBuffer> CryptoHybrid::pointAddScalar(
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& publicKey,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& tweak,
  std::optional<bool> isCompressed
) {
  bool comp = isCompressed.value_or(true);
  auto pkBytes = bytesFromVariant(publicKey);
  auto t32 = require32(tweak, "tweak");

  secp256k1_pubkey pk = parsePubkey(pkBytes);

  // P = P + t*G
  if (secp256k1_ec_pubkey_tweak_add(ctx(), &pk, t32.data()) != 1) {
    throw std::runtime_error("Tweak add failed (invalid tweak or infinity)");
  }

  return toAB(serializePubkey(pk, comp));
}

/* ----------------------------- ECDSA sign/verify -------------------------- */
/* Assumption: message is a 32-byte digest (e.g., SHA-256). */

std::shared_ptr<ArrayBuffer> CryptoHybrid::sign(
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& secretKey,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& message
) {
  auto sk = require32(secretKey, "secretKey");
  auto msg32 = require32(message, "message");

  if (secp256k1_ec_seckey_verify(ctx(), sk.data()) != 1)
    throw std::invalid_argument("Invalid secret key");

  secp256k1_ecdsa_signature sig{};
  if (secp256k1_ecdsa_sign(ctx(), &sig, msg32.data(), sk.data(), nullptr, nullptr) != 1) {
    throw std::runtime_error("ECDSA sign failed");
  }

  // DER serialize
  std::vector<uint8_t> der(72); // max DER size ~72 bytes
  size_t derlen = der.size();
  if (secp256k1_ecdsa_signature_serialize_der(ctx(), der.data(), &derlen, &sig) != 1) {
    throw std::runtime_error("ECDSA DER serialization failed");
  }
  der.resize(derlen);
  return toAB(der);
}

bool CryptoHybrid::verify(
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& publicKey,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& message,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& signature
) {
  auto pkBytes = bytesFromVariant(publicKey);
  auto msg32 = require32(message, "message");

  secp256k1_pubkey pk = parsePubkey(pkBytes);

  auto sigBytes = bytesFromVariant(signature);
  secp256k1_ecdsa_signature sig{};

  int parsed = 0;
  // Try DER first
  if (!sigBytes.empty()) {
    parsed = secp256k1_ecdsa_signature_parse_der(ctx(), &sig, sigBytes.data(), sigBytes.size());
    if (!parsed && sigBytes.size() == 64) {
      // Try compact if 64 bytes
      parsed = secp256k1_ecdsa_signature_parse_compact(ctx(), &sig, sigBytes.data());
    }
  }
  if (!parsed) return false;

  // Normalize (makes high-S equal low-S for verification)
  secp256k1_ecdsa_signature sigNorm = sig;
  (void)secp256k1_ecdsa_signature_normalize(ctx(), &sigNorm, &sig);

  return secp256k1_ecdsa_verify(ctx(), &sigNorm, msg32.data(), &pk) == 1;
}

/* -------------------------- Schnorr sign/verify --------------------------- */
/* Assumption: messageHash is a 32-byte BIP340 digest; pubkey may be 32-byte xonly
   or 33/65-byte normal EC key (we’ll convert to xonly). */

std::shared_ptr<ArrayBuffer> CryptoHybrid::signSchnorr(
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& secretKey,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& messageHash,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& auxRand
) {
  auto sk    = require32(secretKey,   "secretKey");
  auto msg32 = require32(messageHash, "messageHash");
  auto aux32 = require32(auxRand,     "auxRand");

  LOGI("signSchnorr sk=%s", toHex(sk.data(), 32).c_str());
  LOGI("signSchnorr msg=%s", toHex(msg32.data(), 32).c_str());
  LOGI("signSchnorr aux=%s", toHex(aux32.data(), 32).c_str());

  if (secp256k1_ec_seckey_verify(ctx(), sk.data()) != 1)
    throw std::invalid_argument("Invalid secret key");

  secp256k1_keypair keypair;
  if (secp256k1_keypair_create(ctx(), &keypair, sk.data()) != 1)
    throw std::runtime_error("keypair_create failed");

  // --- DEBUG: log x-only and compressed pubkeys ---
  {
    // X-only pubkey (BIP340)
    secp256k1_xonly_pubkey xpk{};
    int parity = 0;
    if (secp256k1_keypair_xonly_pub(ctx(), &xpk, &parity, &keypair) == 1) {
      unsigned char x32[32];
      secp256k1_xonly_pubkey_serialize(ctx(), x32, &xpk);
      LOGI("signSchnorr xonly.pk.x=%s parity=%d", toHex(x32, 32).c_str(), parity);
    } else {
      LOGI("signSchnorr xonly.pk FAILED");
    }

    // Full compressed pubkey (33 bytes)
    secp256k1_pubkey full{};
    if (secp256k1_ec_pubkey_create(ctx(), &full, sk.data()) == 1) {
      unsigned char comp33[33];
      size_t compLen = 33;
      if (secp256k1_ec_pubkey_serialize(ctx(), comp33, &compLen, &full, SECP256K1_EC_COMPRESSED) == 1) {
        LOGI("signSchnorr pubkey(compressed,33)=%s", toHex(comp33, compLen).c_str());
      } else {
        LOGI("signSchnorr pubkey serialize FAILED");
      }
    } else {
      LOGI("signSchnorr ec_pubkey_create FAILED");
    }
  }

  std::array<unsigned char, 64> sig64{};
  if (secp256k1_schnorrsig_sign32(ctx(), sig64.data(), msg32.data(), &keypair, aux32.data()) != 1)
    throw std::runtime_error("schnorrsig_sign32 failed");

  // --- Self-verify before returning ---
  secp256k1_xonly_pubkey xpk{};
  int parity = 0;
  if (secp256k1_keypair_xonly_pub(ctx(), &xpk, &parity, &keypair) != 1)
    throw std::runtime_error("keypair_xonly_pub failed");

  if (secp256k1_schnorrsig_verify(ctx(), sig64.data(), msg32.data(), 32, &xpk) != 1) {
    LOGI("signSchnorr self-verify FAILED");
    throw std::runtime_error("Schnorr self-verify failed");
  }

  LOGI("signSchnorr sig=%s", toHex(sig64.data(), 64).c_str());
  return toAB(std::vector<uint8_t>(sig64.begin(), sig64.end()));
}

bool CryptoHybrid::verifySchnorr(
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& publicKey,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& messageHash,
  const std::variant<std::string, std::shared_ptr<ArrayBuffer>>& signature
) {
  auto msg32 = require32(messageHash, "messageHash");
  auto sig = bytesFromVariant(signature);
  if (sig.size() != 64) return false;

  auto pkBytes = bytesFromVariant(publicKey);
  LOGI("verifySchnorr pkLen=%zu msg=%s sig=%s", pkBytes.size(),
       toHex(reinterpret_cast<const uint8_t*>(msg32.data()), 32).c_str(),
       toHex(sig.data(), 64).c_str());

  secp256k1_xonly_pubkey xpk{};
  if (pkBytes.size() == 32) {
    if (secp256k1_xonly_pubkey_parse(ctx(), &xpk, pkBytes.data()) != 1) return false;
  } else {
    try {
      secp256k1_pubkey full = parsePubkey(pkBytes);
      int parity = 0;
      if (secp256k1_xonly_pubkey_from_pubkey(ctx(), &xpk, &parity, &full) != 1) return false;
    } catch (...) { return false; }
  }

  return secp256k1_schnorrsig_verify(ctx(), sig.data(), msg32.data(), 32, &xpk) == 1;
}

} // namespace margelo::nitro::nitroavalabscrypto
#pragma once

#include <array>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <string>
#include <vector>

#include <openssl/crypto.h>
#include <openssl/evp.h>
#include <openssl/hmac.h>

#include "base58.hpp"

namespace margelo::nitro::nitroavalabscrypto {

// ---------------------------------------------------------------------------
// SLIP-0010 Ed25519 hardened derivation
//
// Reference: https://github.com/satoshilabs/slips/blob/master/slip-0010.md
// Ed25519 only supports hardened child derivation.  The derivation path for
// Solana is m/44'/501'/{accountIndex}'/0'.
// ---------------------------------------------------------------------------

struct SLIP0010Key {
    std::array<uint8_t, 32> secret;     // private key (IL)
    std::array<uint8_t, 32> chain_code; // chain code (IR)
};

// HMAC-SHA512 helper (same algorithm as in address_derivation.hpp but
// using std::array for fixed-size outputs).
inline std::array<uint8_t, 64> slip0010_hmac_sha512(
        const uint8_t *key, size_t key_len,
        const uint8_t *data, size_t data_len) {
    std::array<uint8_t, 64> out{};
    unsigned int out_len = 64;
    // HMAC() returns NULL on allocator/EVP failure. Without this check we
    // would continue with a zeroed output buffer and silently produce a
    // deterministic but wrong derivation.
    if (HMAC(EVP_sha512(), key, static_cast<int>(key_len),
             data, data_len, out.data(), &out_len) == nullptr) {
        throw std::runtime_error("slip0010_hmac_sha512: HMAC failed");
    }
    return out;
}

// Master key from BIP39 seed: HMAC-SHA512("ed25519 seed", seed)
inline SLIP0010Key slip0010_master_key(const uint8_t *seed, size_t seed_len) {
    static constexpr const char *CURVE_KEY = "ed25519 seed";
    auto I = slip0010_hmac_sha512(
        reinterpret_cast<const uint8_t *>(CURVE_KEY), 12,
        seed, seed_len);

    SLIP0010Key key{};
    std::copy(I.begin(), I.begin() + 32, key.secret.begin());
    std::copy(I.begin() + 32, I.end(), key.chain_code.begin());
    OPENSSL_cleanse(I.data(), I.size());
    return key;
}

// Hardened child derivation: HMAC-SHA512(chainCode, 0x00 || secret || ser32(index + 0x80000000))
inline SLIP0010Key slip0010_derive_hardened(const SLIP0010Key &parent, uint32_t index) {
    // Reject indices that already carry the hardening flag — see the matching
    // check in bip32_derive_hardened_child for rationale. SLIP-0010 ed25519
    // only supports hardened derivation so this guard applies to every call.
    if (index >= 0x80000000u) {
        throw std::invalid_argument(
            "slip0010_derive_hardened: index must be < 2^31 "
            "(hardening flag is applied internally)");
    }

    // data = 0x00 || parent.secret (32 bytes) || ser32(index | 0x80000000) (4 bytes)
    std::array<uint8_t, 37> data{};
    data[0] = 0x00;
    std::memcpy(data.data() + 1, parent.secret.data(), 32);
    uint32_t hardened = index | 0x80000000u;
    data[33] = static_cast<uint8_t>((hardened >> 24) & 0xFF);
    data[34] = static_cast<uint8_t>((hardened >> 16) & 0xFF);
    data[35] = static_cast<uint8_t>((hardened >> 8) & 0xFF);
    data[36] = static_cast<uint8_t>(hardened & 0xFF);

    auto I = slip0010_hmac_sha512(
        parent.chain_code.data(), parent.chain_code.size(),
        data.data(), data.size());

    SLIP0010Key child{};
    std::copy(I.begin(), I.begin() + 32, child.secret.begin());
    std::copy(I.begin() + 32, I.end(), child.chain_code.begin());
    OPENSSL_cleanse(I.data(), I.size());
    OPENSSL_cleanse(data.data(), data.size());
    return child;
}

// Derive through a full SLIP-0010 hardened path from a master key.
// Path segments are raw indices (NOT pre-hardened — hardening is applied internally).
inline SLIP0010Key slip0010_derive_path(const SLIP0010Key &master,
                                         const std::vector<uint32_t> &path) {
    SLIP0010Key current = master;
    for (uint32_t index : path) {
        auto child = slip0010_derive_hardened(current, index);
        OPENSSL_cleanse(current.secret.data(), current.secret.size());
        OPENSSL_cleanse(current.chain_code.data(), current.chain_code.size());
        current = child;
    }
    return current;
}

// ---------------------------------------------------------------------------
// Ed25519 public key from SLIP-0010 secret
//
// Uses OpenSSL EVP_PKEY_new_raw_private_key / EVP_PKEY_get_raw_public_key
// to compute the Ed25519 public key (scalar-to-point on Curve25519).
// ---------------------------------------------------------------------------

inline std::array<uint8_t, 32> ed25519_public_key(const std::array<uint8_t, 32> &secret) {
    EVP_PKEY *pkey = EVP_PKEY_new_raw_private_key(
        EVP_PKEY_ED25519, nullptr, secret.data(), 32);
    if (!pkey) {
        throw std::runtime_error("Ed25519: failed to create private key");
    }

    std::array<uint8_t, 32> pub_key{};
    size_t pub_len = 32;
    if (EVP_PKEY_get_raw_public_key(pkey, pub_key.data(), &pub_len) != 1 || pub_len != 32) {
        EVP_PKEY_free(pkey);
        throw std::runtime_error("Ed25519: failed to derive public key");
    }
    EVP_PKEY_free(pkey);
    return pub_key;
}

// ---------------------------------------------------------------------------
// Solana address from seed + account index
//
// Derivation path: m/44'/501'/{accountIndex}'/0'
// Result: base58-encoded 32-byte Ed25519 public key
// ---------------------------------------------------------------------------

// Derive Solana address from a pre-computed SLIP-0010 master key.
// Use this when deriving multiple accounts to avoid recomputing the master.
inline std::string solana_address_from_master(
        const SLIP0010Key &master,
        uint32_t account_index) {

    // m/44'/501'/{accountIndex}'/0'
    auto derived = slip0010_derive_path(master, {44, 501, account_index, 0});

    auto pub_key = ed25519_public_key(derived.secret);
    OPENSSL_cleanse(derived.secret.data(), derived.secret.size());
    OPENSSL_cleanse(derived.chain_code.data(), derived.chain_code.size());

    return base58_encode(std::vector<uint8_t>(pub_key.begin(), pub_key.end()));
}

inline std::string solana_address_from_seed(
        const uint8_t *seed, size_t seed_len,
        uint32_t account_index) {

    auto master = slip0010_master_key(seed, seed_len);
    auto result = solana_address_from_master(master, account_index);
    OPENSSL_cleanse(master.secret.data(), master.secret.size());
    OPENSSL_cleanse(master.chain_code.data(), master.chain_code.size());
    return result;
}

} // namespace margelo::nitro::nitroavalabscrypto

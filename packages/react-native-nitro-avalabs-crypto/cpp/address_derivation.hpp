#pragma once

#include <array>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <string>
#include <vector>

#include <secp256k1.h>
#include <openssl/crypto.h>
#include <openssl/evp.h>
#include <openssl/hmac.h>

#include "base58.hpp"
#include "bech32.hpp"
#include "keccak256.hpp"

namespace margelo::nitro::nitroavalabscrypto {

// ---------------------------------------------------------------------------
// OpenSSL hash helpers
// ---------------------------------------------------------------------------

inline std::vector<uint8_t> sha256(const uint8_t *data, size_t len) {
    std::vector<uint8_t> out(32);
    EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
    if (!mdctx) {
        throw std::runtime_error("sha256: EVP_MD_CTX_new failed");
    }
    if (EVP_DigestInit_ex(mdctx, EVP_sha256(), nullptr) != 1 ||
        EVP_DigestUpdate(mdctx, data, len) != 1) {
        EVP_MD_CTX_free(mdctx);
        throw std::runtime_error("sha256: digest computation failed");
    }
    unsigned int md_len = 0;
    if (EVP_DigestFinal_ex(mdctx, out.data(), &md_len) != 1) {
        EVP_MD_CTX_free(mdctx);
        throw std::runtime_error("sha256: digest finalization failed");
    }
    EVP_MD_CTX_free(mdctx);
    return out;
}

inline std::vector<uint8_t> ripemd160(const uint8_t *data, size_t len) {
    std::vector<uint8_t> out(20);
    EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
    if (!mdctx) {
        throw std::runtime_error("ripemd160: EVP_MD_CTX_new failed");
    }
    if (EVP_DigestInit_ex(mdctx, EVP_ripemd160(), nullptr) != 1 ||
        EVP_DigestUpdate(mdctx, data, len) != 1) {
        EVP_MD_CTX_free(mdctx);
        throw std::runtime_error("ripemd160: digest computation failed");
    }
    unsigned int md_len = 0;
    if (EVP_DigestFinal_ex(mdctx, out.data(), &md_len) != 1) {
        EVP_MD_CTX_free(mdctx);
        throw std::runtime_error("ripemd160: digest finalization failed");
    }
    EVP_MD_CTX_free(mdctx);
    return out;
}

// Hash160 = RIPEMD-160(SHA-256(data))
inline std::vector<uint8_t> hash160(const uint8_t *data, size_t len) {
    auto s = sha256(data, len);
    return ripemd160(s.data(), s.size());
}

inline std::vector<uint8_t> hmac_sha512(const uint8_t *key, size_t key_len,
                                         const uint8_t *data, size_t data_len) {
    std::vector<uint8_t> out(64);
    unsigned int out_len = 64;
    // HMAC() returns NULL on allocator/EVP failure. Without this check we would
    // continue with a zeroed output buffer and silently produce a deterministic
    // but wrong derivation — i.e. wrong addresses, no error to the caller.
    if (HMAC(EVP_sha512(), key, static_cast<int>(key_len),
             data, data_len, out.data(), &out_len) == nullptr) {
        throw std::runtime_error("hmac_sha512: HMAC failed");
    }
    return out;
}

// ---------------------------------------------------------------------------
// BIP32 public child derivation
// ---------------------------------------------------------------------------

struct BIP32PublicKey {
    std::vector<uint8_t> key;        // 33 bytes compressed
    std::vector<uint8_t> chain_code; // 32 bytes
};

// Derive a non-hardened child public key at the given index.
inline BIP32PublicKey bip32_derive_public_child(
        secp256k1_context *ctx,
        const BIP32PublicKey &parent,
        uint32_t index) {

    if (index >= 0x80000000u) {
        throw std::invalid_argument("Cannot derive hardened child from public key");
    }

    // data = compressed_pubkey (33) || ser32(index) (4)
    std::vector<uint8_t> data(37);
    std::memcpy(data.data(), parent.key.data(), 33);
    data[33] = static_cast<uint8_t>((index >> 24) & 0xFF);
    data[34] = static_cast<uint8_t>((index >> 16) & 0xFF);
    data[35] = static_cast<uint8_t>((index >> 8) & 0xFF);
    data[36] = static_cast<uint8_t>(index & 0xFF);

    auto I = hmac_sha512(parent.chain_code.data(), parent.chain_code.size(),
                          data.data(), data.size());

    // IL = I[0..32], IR = I[32..64]
    std::vector<uint8_t> IL(I.begin(), I.begin() + 32);
    std::vector<uint8_t> IR(I.begin() + 32, I.end());

    // childKey = point(IL) + parentKey
    secp256k1_pubkey parent_pk;
    if (!secp256k1_ec_pubkey_parse(ctx, &parent_pk,
                                    parent.key.data(), parent.key.size())) {
        throw std::runtime_error("Failed to parse parent public key");
    }

    if (!secp256k1_ec_pubkey_tweak_add(ctx, &parent_pk, IL.data())) {
        throw std::runtime_error("Failed to tweak public key (invalid IL)");
    }

    // Serialize child key (compressed)
    std::vector<uint8_t> child_key(33);
    size_t out_len = 33;
    secp256k1_ec_pubkey_serialize(ctx, child_key.data(), &out_len,
                                  &parent_pk, SECP256K1_EC_COMPRESSED);

    return {child_key, IR};
}

// Derive through a chain of non-hardened indices (e.g. [0, accountIndex])
inline BIP32PublicKey bip32_derive_path(
        secp256k1_context *ctx,
        const BIP32PublicKey &root,
        const std::vector<uint32_t> &indices) {
    BIP32PublicKey current = root;
    for (uint32_t idx : indices) {
        current = bip32_derive_public_child(ctx, current, idx);
    }
    return current;
}

// ---------------------------------------------------------------------------
// BIP32 private (hardened) child derivation
//
// Required for deriving account-level xpubs from the BIP39 seed, where the
// path contains hardened segments (e.g. m/44'/60'/0', m/44'/9000'/{i}').
// ---------------------------------------------------------------------------

// Fixed-size storage so secret bytes live inline in the struct (no separate
// heap allocations that std::vector can move/realloc and leave uncleansed).
// Mirrors the SLIP0010Key pattern in slip0010.hpp.
struct BIP32PrivateKey {
    std::array<uint8_t, 32> key{};        // 32 bytes private key
    std::array<uint8_t, 32> chain_code{}; // 32 bytes
};

// Master key from BIP39 seed: HMAC-SHA512("Bitcoin seed", seed)
inline BIP32PrivateKey bip32_master_from_seed(const uint8_t *seed, size_t seed_len) {
    auto I = hmac_sha512(
        reinterpret_cast<const uint8_t *>("Bitcoin seed"), 12,
        seed, seed_len);
    BIP32PrivateKey result;
    std::copy(I.begin(), I.begin() + 32, result.key.begin());
    std::copy(I.begin() + 32, I.end(), result.chain_code.begin());
    OPENSSL_cleanse(I.data(), I.size());
    return result;
}

// Derive a hardened child private key.
// data = 0x00 || ser256(parent_key) || ser32(index | 0x80000000)
inline BIP32PrivateKey bip32_derive_hardened_child(
        secp256k1_context *ctx,
        const BIP32PrivateKey &parent,
        uint32_t index) {

    // Reject indices that already carry the hardening flag — otherwise an
    // index in [2^31, 2^32) silently collides with the hardened range and
    // derives a different child than the caller intended. Callers feeding
    // unvalidated input would produce wrong addresses with no error.
    if (index >= 0x80000000u) {
        throw std::invalid_argument(
            "bip32_derive_hardened_child: index must be < 2^31 "
            "(hardening flag is applied internally)");
    }

    std::array<uint8_t, 37> data{};
    data[0] = 0x00;
    std::memcpy(data.data() + 1, parent.key.data(), 32);
    uint32_t hardened = index | 0x80000000u;
    data[33] = static_cast<uint8_t>((hardened >> 24) & 0xFF);
    data[34] = static_cast<uint8_t>((hardened >> 16) & 0xFF);
    data[35] = static_cast<uint8_t>((hardened >> 8) & 0xFF);
    data[36] = static_cast<uint8_t>(hardened & 0xFF);

    auto I = hmac_sha512(parent.chain_code.data(), parent.chain_code.size(),
                          data.data(), data.size());

    BIP32PrivateKey child;
    std::copy(I.begin(), I.begin() + 32, child.key.begin());
    std::copy(I.begin() + 32, I.end(), child.chain_code.begin());
    OPENSSL_cleanse(I.data(), I.size());

    // child.key = parse256(IL) + parent.key (mod n)
    if (secp256k1_ec_seckey_tweak_add(ctx, child.key.data(), parent.key.data()) != 1) {
        OPENSSL_cleanse(child.key.data(), child.key.size());
        OPENSSL_cleanse(child.chain_code.data(), child.chain_code.size());
        OPENSSL_cleanse(data.data(), data.size());
        throw std::runtime_error("BIP32 hardened derivation failed (invalid key)");
    }
    OPENSSL_cleanse(data.data(), data.size());

    return child;
}

// Derive a hardened path (e.g. [44, 60, 0] for m/44'/60'/0')
inline BIP32PrivateKey bip32_derive_hardened_path(
        secp256k1_context *ctx,
        const BIP32PrivateKey &master,
        const std::vector<uint32_t> &indices) {
    BIP32PrivateKey current = master;
    for (uint32_t idx : indices) {
        auto child = bip32_derive_hardened_child(ctx, current, idx);
        // Zero the outgoing intermediate key. On the first iteration this
        // cleanses a *copy* of master (harmless); on later iterations it
        // cleanses a genuine intermediate private key. Since `current` is
        // std::array-based, this clears every byte; nothing strands on a
        // moved-from heap allocation.
        OPENSSL_cleanse(current.key.data(), current.key.size());
        OPENSSL_cleanse(current.chain_code.data(), current.chain_code.size());
        current = child;
    }
    return current;
}

// Convert a private key to its corresponding BIP32PublicKey (for public child derivation)
inline BIP32PublicKey bip32_private_to_public(
        secp256k1_context *ctx,
        const BIP32PrivateKey &priv) {
    secp256k1_pubkey pk;
    if (secp256k1_ec_pubkey_create(ctx, &pk, priv.key.data()) != 1) {
        throw std::runtime_error("Failed to create public key from private key");
    }
    std::vector<uint8_t> compressed(33);
    size_t out_len = 33;
    secp256k1_ec_pubkey_serialize(ctx, compressed.data(), &out_len,
                                  &pk, SECP256K1_EC_COMPRESSED);
    return BIP32PublicKey{
        compressed,
        std::vector<uint8_t>(priv.chain_code.begin(), priv.chain_code.end())
    };
}

// ---------------------------------------------------------------------------
// Address derivation from compressed public key
// ---------------------------------------------------------------------------

// Decompress a 33-byte compressed secp256k1 public key to 65 bytes (04||x||y)
inline std::vector<uint8_t> decompress_pubkey(
        secp256k1_context *ctx,
        const std::vector<uint8_t> &compressed) {
    secp256k1_pubkey pk;
    if (!secp256k1_ec_pubkey_parse(ctx, &pk,
                                    compressed.data(), compressed.size())) {
        throw std::runtime_error("Failed to parse compressed public key");
    }
    std::vector<uint8_t> out(65);
    size_t out_len = 65;
    secp256k1_ec_pubkey_serialize(ctx, out.data(), &out_len,
                                  &pk, SECP256K1_EC_UNCOMPRESSED);
    return out;
}

// Hex encode helper
inline std::string to_hex(const uint8_t *data, size_t len) {
    static const char hex_chars[] = "0123456789abcdef";
    std::string result;
    result.resize(len * 2);
    for (size_t i = 0; i < len; i++) {
        result[2 * i] = hex_chars[data[i] >> 4];
        result[2 * i + 1] = hex_chars[data[i] & 0x0F];
    }
    return result;
}

// EVM address: Keccak-256 of uncompressed pubkey (sans 04 prefix) → last 20 bytes → EIP-55
inline std::string evm_address_from_pubkey(
        secp256k1_context *ctx,
        const std::vector<uint8_t> &compressed_pubkey) {
    auto uncompressed = decompress_pubkey(ctx, compressed_pubkey);
    // Keccak-256 of the 64 bytes after the 0x04 prefix
    auto hash = keccak256(uncompressed.data() + 1, 64);
    // Last 20 bytes
    std::vector<uint8_t> addr_bytes(hash.end() - 20, hash.end());

    // EIP-55 checksum: Keccak-256 of lowercase hex, uppercase where nibble >= 8
    std::string addr_hex = to_hex(addr_bytes.data(), addr_bytes.size());
    auto checksum_hash = keccak256(
        reinterpret_cast<const uint8_t *>(addr_hex.data()), addr_hex.size());

    std::string result = "0x";
    for (size_t i = 0; i < 40; i++) {
        uint8_t hash_nibble = (checksum_hash[i / 2] >> (i % 2 == 0 ? 4 : 0)) & 0x0F;
        char c = addr_hex[i];
        if (c >= 'a' && c <= 'f' && hash_nibble >= 8) {
            result += static_cast<char>(c - 32); // uppercase
        } else {
            result += c;
        }
    }
    return result;
}

// BTC P2WPKH address: Hash160(compressed pubkey) → bech32 segwit v0
inline std::string btc_address_from_pubkey(
        const std::vector<uint8_t> &compressed_pubkey,
        bool is_testnet) {
    auto h = hash160(compressed_pubkey.data(), compressed_pubkey.size());
    std::string hrp = is_testnet ? "tb" : "bc";
    return bech32_encode_segwit(hrp, 0, h);
}

// Avalanche bech32 address: Hash160(compressed pubkey) → bech32 with avax/fuji HRP
inline std::string avalanche_bech32_from_pubkey(
        const std::vector<uint8_t> &compressed_pubkey,
        const std::string &hrp) {
    auto h = hash160(compressed_pubkey.data(), compressed_pubkey.size());
    return bech32_encode_avalanche(hrp, h);
}

// ---------------------------------------------------------------------------
// Full address set from xpubs for one account index
// ---------------------------------------------------------------------------

struct AddressSet {
    std::string evm;
    std::string btc;
    std::string avm;
    std::string pvm;
    std::string coreEth;
};

inline AddressSet derive_addresses_for_index(
        secp256k1_context *ctx,
        const Xpub &evm_xpub,
        const Xpub &avalanche_xpub,
        bool is_testnet,
        uint32_t account_index) {

    std::string avax_hrp = is_testnet ? "fuji" : "avax";

    // EVM: derive child at path 0/{accountIndex}
    BIP32PublicKey evm_root{evm_xpub.public_key, evm_xpub.chain_code};
    auto evm_child = bip32_derive_path(ctx, evm_root, {0, account_index});

    // Avalanche: derive child at path 0/0
    BIP32PublicKey avax_root{avalanche_xpub.public_key, avalanche_xpub.chain_code};
    auto avax_child = bip32_derive_path(ctx, avax_root, {0, 0});

    AddressSet result;
    result.evm = evm_address_from_pubkey(ctx, evm_child.key);
    result.btc = btc_address_from_pubkey(evm_child.key, is_testnet);

    auto avax_bech32 = avalanche_bech32_from_pubkey(avax_child.key, avax_hrp);
    result.avm = "X-" + avax_bech32;
    result.pvm = "P-" + avax_bech32;

    auto core_eth_bech32 = avalanche_bech32_from_pubkey(evm_child.key, avax_hrp);
    result.coreEth = "C-" + core_eth_bech32;

    return result;
}

// ---------------------------------------------------------------------------
// Full address derivation from seed for one account index
// ---------------------------------------------------------------------------

inline AddressSet derive_all_addresses_for_index(
        secp256k1_context *ctx,
        const BIP32PrivateKey &bip32_master,
        const BIP32PublicKey &evm_xpub,  // pre-derived m/44'/60'/0'
        bool is_testnet,
        uint32_t account_index) {

    // Avalanche xpub: m/44'/9000'/{accountIndex}' (hardened from master)
    auto avax_priv = bip32_derive_hardened_path(ctx, bip32_master, {44, 9000, account_index});
    auto avax_xpub = bip32_private_to_public(ctx, avax_priv);
    OPENSSL_cleanse(avax_priv.key.data(), avax_priv.key.size());
    OPENSSL_cleanse(avax_priv.chain_code.data(), avax_priv.chain_code.size());

    // Convert BIP32PublicKey to Xpub for derive_addresses_for_index
    Xpub evm_xpub_converted{evm_xpub.key, evm_xpub.chain_code};
    Xpub avax_xpub_converted{avax_xpub.key, avax_xpub.chain_code};

    return derive_addresses_for_index(ctx, evm_xpub_converted, avax_xpub_converted, is_testnet, account_index);
}

} // namespace margelo::nitro::nitroavalabscrypto

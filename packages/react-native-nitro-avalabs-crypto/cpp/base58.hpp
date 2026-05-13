#pragma once

#include <array>
#include <cstdint>
#include <cstdio>
#include <stdexcept>
#include <string>
#include <vector>

#include <openssl/sha.h>

// NOTE on OpenSSL 3 deprecation: this file uses the legacy single-call
// `SHA256()` API which is deprecated in OpenSSL 3 in favour of `EVP_Digest`.
// Behaviour is unchanged on every build we target, but builds with
// `-Wdeprecated-declarations` will warn here.  Migrating to `EVP_Digest`
// is purely future-proofing; defer until / unless OpenSSL drops the legacy
// API entirely.  Same note applies to `HMAC()` in address_derivation.hpp
// and slip0010.hpp.

namespace margelo::nitro::nitroavalabscrypto {

    // Bitcoin Base58 alphabet
    static constexpr const char *BASE58_ALPHABET =
            "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    // Reverse lookup table: ASCII value -> base58 digit (0-57), or -1 if invalid.
    // Uses a lambda-initialized static local for thread-safe one-time initialization
    // (C++11 guarantee: concurrent callers block until initialization completes).
    inline const int8_t *base58_map() {
        static const auto table = []() {
            std::array<int8_t, 256> t;
            t.fill(-1);
            for (int i = 0; i < 58; ++i) {
                t[static_cast<uint8_t>(BASE58_ALPHABET[i])] = static_cast<int8_t>(i);
            }
            return t;
        }();
        return table.data();
    }

    // ---------------------------------------------------------------------------
    // base58_decode
    //
    // Decodes a Base58-encoded string into raw bytes.
    //   - Leading '1' characters map to leading 0x00 bytes.
    //   - Throws std::invalid_argument on invalid characters.
    // ---------------------------------------------------------------------------
    inline std::vector<uint8_t> base58_decode(const std::string &encoded) {
        const int8_t *map = base58_map();

        // Count leading '1' characters (each represents a leading 0x00 byte)
        size_t leading_zeros = 0;
        while (leading_zeros < encoded.size() && encoded[leading_zeros] == '1') {
            ++leading_zeros;
        }

        // Allocate enough space for the result.
        // log(58) / log(256) ~= 0.733, so decoded length <= encoded.size() * 733/1000 + 1
        size_t max_size = (encoded.size() - leading_zeros) * 733 / 1000 + 1;
        std::vector<uint8_t> result(max_size, 0);

        // Process each Base58 character
        for (size_t i = leading_zeros; i < encoded.size(); ++i) {
            int8_t digit = map[static_cast<uint8_t>(encoded[i])];
            if (digit < 0) {
                throw std::invalid_argument(
                        "base58_decode: invalid character '" +
                        std::string(1, encoded[i]) + "'");
            }

            // Multiply the existing result by 58 and add the new digit
            int carry = digit;
            for (auto it = result.rbegin(); it != result.rend(); ++it) {
                carry += 58 * static_cast<int>(*it);
                *it = static_cast<uint8_t>(carry % 256);
                carry /= 256;
            }
        }

        // Skip leading zeros in the computed result
        auto it = result.begin();
        while (it != result.end() && *it == 0) {
            ++it;
        }

        // Prepend the leading zero bytes, then append the significant bytes
        std::vector<uint8_t> decoded;
        decoded.reserve(leading_zeros + static_cast<size_t>(result.end() - it));
        decoded.assign(leading_zeros, 0x00);
        decoded.insert(decoded.end(), it, result.end());

        return decoded;
    }

    // ---------------------------------------------------------------------------
    // base58check_decode
    //
    // Decodes a Base58Check-encoded string. Verifies the trailing 4-byte
    // double-SHA-256 checksum and returns the payload without the checksum.
    //   - Throws std::invalid_argument if the data is too short or the checksum
    //     does not match.
    // ---------------------------------------------------------------------------
    inline std::vector<uint8_t> base58check_decode(const std::string &encoded) {
        std::vector<uint8_t> data = base58_decode(encoded);

        if (data.size() < 4) {
            throw std::invalid_argument(
                    "base58check_decode: input too short for checksum");
        }

        // Split into payload and checksum
        size_t payload_len = data.size() - 4;
        const uint8_t *payload_ptr = data.data();
        const uint8_t *checksum_ptr = data.data() + payload_len;

        // Compute double SHA-256 of the payload.
        // OpenSSL `SHA256()` returns NULL on allocator/provider failure;
        // continuing with an uninitialized buffer would compare the
        // checksum against stack garbage and could either spuriously pass
        // (accept a malformed xpub → wrong downstream derivation) or fail.
        // Mirror the null-check pattern used by hmac_sha512 elsewhere.
        uint8_t hash1[SHA256_DIGEST_LENGTH];
        if (SHA256(payload_ptr, payload_len, hash1) == nullptr) {
            throw std::runtime_error(
                "base58check_decode: SHA256 (first pass) failed");
        }

        uint8_t hash2[SHA256_DIGEST_LENGTH];
        if (SHA256(hash1, SHA256_DIGEST_LENGTH, hash2) == nullptr) {
            throw std::runtime_error(
                "base58check_decode: SHA256 (second pass) failed");
        }

        // Compare first 4 bytes of the double hash with the checksum
        if (hash2[0] != checksum_ptr[0] ||
            hash2[1] != checksum_ptr[1] ||
            hash2[2] != checksum_ptr[2] ||
            hash2[3] != checksum_ptr[3]) {
            throw std::invalid_argument(
                    "base58check_decode: checksum verification failed");
        }

        return std::vector<uint8_t>(payload_ptr, payload_ptr + payload_len);
    }

    // ---------------------------------------------------------------------------
    // Xpub
    //
    // Holds the parsed fields from a BIP-32 extended public key.
    // ---------------------------------------------------------------------------
    struct Xpub {
        std::vector<uint8_t> public_key;  // 33 bytes (compressed SEC1)
        std::vector<uint8_t> chain_code;  // 32 bytes
    };

    // ---------------------------------------------------------------------------
    // parse_xpub
    //
    // Parses a Base58Check-encoded extended public key string (e.g. "xpub...").
    // The 78-byte serialised format (BIP-32) is:
    //   [ 4 version | 1 depth | 4 fingerprint | 4 child-number |
    //     32 chain-code | 33 key ]
    //
    // Extracts:
    //   chain_code  = bytes [13..45)
    //   public_key  = bytes [45..78)
    // ---------------------------------------------------------------------------
    inline Xpub parse_xpub(const std::string &xpub_base58) {
        std::vector<uint8_t> payload = base58check_decode(xpub_base58);

        if (payload.size() != 78) {
            throw std::invalid_argument(
                    "parse_xpub: expected 78-byte payload, got " +
                    std::to_string(payload.size()));
        }

        // BIP-32 version bytes (bytes [0..4), big-endian). Whitelist the
        // mainnet/testnet *public* extended-key versions and explicitly reject
        // the matching *private* versions — a confused caller passing an xprv
        // would otherwise feed bytes [45..78) to secp256k1_ec_pubkey_parse,
        // which can succeed on garbage and silently derive a wrong key tree.
        const uint32_t version =
            (static_cast<uint32_t>(payload[0]) << 24) |
            (static_cast<uint32_t>(payload[1]) << 16) |
            (static_cast<uint32_t>(payload[2]) << 8)  |
            (static_cast<uint32_t>(payload[3]));

        constexpr uint32_t XPUB_MAINNET = 0x0488B21Eu;  // "xpub..."
        constexpr uint32_t XPUB_TESTNET = 0x043587CFu;  // "tpub..."
        constexpr uint32_t XPRV_MAINNET = 0x0488ADE4u;  // "xprv..."
        constexpr uint32_t XPRV_TESTNET = 0x04358394u;  // "tprv..."

        if (version == XPRV_MAINNET || version == XPRV_TESTNET) {
            throw std::invalid_argument(
                "parse_xpub: extended private key passed where xpub expected");
        }
        if (version != XPUB_MAINNET && version != XPUB_TESTNET) {
            char hex[11];
            std::snprintf(hex, sizeof(hex), "0x%08x", version);
            throw std::invalid_argument(
                std::string("parse_xpub: unsupported version bytes ") + hex);
        }

        // Compressed SEC1 public-key prefix must be 0x02 (even Y) or 0x03
        // (odd Y). Anything else means a corrupted xpub — fail loudly before
        // we hand bytes to secp256k1_ec_pubkey_parse.
        const uint8_t key_prefix = payload[45];
        if (key_prefix != 0x02 && key_prefix != 0x03) {
            char hex[5];
            std::snprintf(hex, sizeof(hex), "0x%02x", key_prefix);
            throw std::invalid_argument(
                std::string("parse_xpub: invalid public-key prefix ") + hex);
        }

        Xpub result;
        result.chain_code.assign(payload.begin() + 13, payload.begin() + 45);
        result.public_key.assign(payload.begin() + 45, payload.begin() + 78);

        return result;
    }

    // ---------------------------------------------------------------------------
    // base58_encode
    //
    // Encodes raw bytes into a Base58 string (Bitcoin alphabet).
    // Used for Solana addresses (plain Base58, not Base58Check).
    // ---------------------------------------------------------------------------
    inline std::string base58_encode(const std::vector<uint8_t> &data) {
        // Count leading zeros
        size_t leading_zeros = 0;
        while (leading_zeros < data.size() && data[leading_zeros] == 0) {
            ++leading_zeros;
        }

        // Allocate enough space: log(256) / log(58) ~= 1.366
        size_t max_size = (data.size() - leading_zeros) * 138 / 100 + 1;
        std::vector<uint8_t> digits(max_size, 0);

        for (size_t i = leading_zeros; i < data.size(); ++i) {
            int carry = data[i];
            for (auto it = digits.rbegin(); it != digits.rend(); ++it) {
                carry += 256 * static_cast<int>(*it);
                *it = static_cast<uint8_t>(carry % 58);
                carry /= 58;
            }
        }

        // Skip leading zeros in digits
        auto it = digits.begin();
        while (it != digits.end() && *it == 0) ++it;

        // Build result: leading '1's + encoded digits
        std::string result(leading_zeros, '1');
        for (; it != digits.end(); ++it) {
            result += BASE58_ALPHABET[*it];
        }

        return result;
    }

} // namespace margelo::nitro::nitroavalabscrypto

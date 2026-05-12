#pragma once

// Bech32 encoding (BIP-173) - header-only implementation
// Supports both Bitcoin segwit (witness version prefix) and
// Avalanche-style (plain data, no witness version) bech32 addresses.

#include <cstdint>
#include <stdexcept>
#include <string>
#include <vector>

namespace margelo::nitro::nitroavalabscrypto {

    // ---------- constants ----------

    static constexpr const char* BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

    // Generator values for the Bech32 BCH code.
    static constexpr uint32_t BECH32_GENERATORS[5] = {
        0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3
    };

    // Bech32 (BIP-173) uses constant 1; bech32m (BIP-350) uses 0x2bc830a3.
    // We only need standard bech32 here.
    static constexpr uint32_t BECH32_CONST = 1;

    // ---------- internal helpers ----------

    // Compute the Bech32 polymod checksum over a stream of values.
    inline uint32_t bech32_polymod(const std::vector<uint8_t>& values) {
        uint32_t chk = 1;
        for (auto v : values) {
            uint8_t top = chk >> 25;
            chk = ((chk & 0x1ffffff) << 5) ^ v;
            for (int i = 0; i < 5; ++i) {
                if ((top >> i) & 1) {
                    chk ^= BECH32_GENERATORS[i];
                }
            }
        }
        return chk;
    }

    // Expand the human-readable part for checksum computation.
    // Returns [high-bits of each char] ++ [0] ++ [low-bits of each char].
    inline std::vector<uint8_t> bech32_hrp_expand(const std::string& hrp) {
        std::vector<uint8_t> ret;
        ret.reserve(hrp.size() * 2 + 1);
        for (char c : hrp) {
            ret.push_back(static_cast<uint8_t>(c) >> 5);
        }
        ret.push_back(0);
        for (char c : hrp) {
            ret.push_back(static_cast<uint8_t>(c) & 0x1f);
        }
        return ret;
    }

    // Create the 6-value bech32 checksum for the given HRP and data (5-bit values).
    inline std::vector<uint8_t> bech32_create_checksum(const std::string& hrp,
                                                       const std::vector<uint8_t>& data) {
        std::vector<uint8_t> values = bech32_hrp_expand(hrp);
        values.insert(values.end(), data.begin(), data.end());
        // Append 6 zero bytes for the checksum positions.
        values.resize(values.size() + 6, 0);

        uint32_t polymod = bech32_polymod(values) ^ BECH32_CONST;
        std::vector<uint8_t> checksum(6);
        for (int i = 0; i < 6; ++i) {
            checksum[i] = static_cast<uint8_t>((polymod >> (5 * (5 - i))) & 0x1f);
        }
        return checksum;
    }

    // General bit-conversion: regroup `data` from `frombits`-bit groups into
    // `tobits`-bit groups.  When `pad` is true the final partial group is
    // zero-padded; when false an incomplete group is an error.
    inline std::vector<uint8_t> convert_bits(const std::vector<uint8_t>& data,
                                             int frombits,
                                             int tobits,
                                             bool pad) {
        uint32_t acc = 0;
        int bits = 0;
        const uint32_t maxv = (1u << tobits) - 1;
        std::vector<uint8_t> ret;
        ret.reserve(data.size() * frombits / tobits + 1);

        for (auto value : data) {
            if ((value >> frombits) != 0) {
                throw std::invalid_argument("convert_bits: value out of range");
            }
            acc = (acc << frombits) | value;
            bits += frombits;
            while (bits >= tobits) {
                bits -= tobits;
                ret.push_back(static_cast<uint8_t>((acc >> bits) & maxv));
            }
        }

        if (pad) {
            if (bits > 0) {
                ret.push_back(static_cast<uint8_t>((acc << (tobits - bits)) & maxv));
            }
        } else {
            if (bits >= frombits) {
                throw std::invalid_argument("convert_bits: non-zero padding");
            }
            if ((acc << (tobits - bits)) & maxv) {
                throw std::invalid_argument("convert_bits: non-zero padding bits");
            }
        }
        return ret;
    }

    // Low-level bech32 encode: HRP + already-5-bit data -> bech32 string.
    inline std::string bech32_encode_raw(const std::string& hrp,
                                         const std::vector<uint8_t>& data5) {
        // Validate HRP: 1-83 chars, printable ASCII (33-126), no uppercase.
        if (hrp.empty() || hrp.size() > 83) {
            throw std::invalid_argument("bech32_encode_raw: invalid HRP length");
        }
        for (char c : hrp) {
            if (c < 33 || c > 126) {
                throw std::invalid_argument("bech32_encode_raw: HRP char out of range");
            }
        }

        auto checksum = bech32_create_checksum(hrp, data5);

        std::string result;
        result.reserve(hrp.size() + 1 + data5.size() + 6);

        // HRP (lowercased) + separator
        for (char c : hrp) {
            result += static_cast<char>(c | 0x20); // force lowercase
        }
        result += '1'; // separator

        // Data part
        for (auto d : data5) {
            result += BECH32_CHARSET[d];
        }
        // Checksum
        for (auto c : checksum) {
            result += BECH32_CHARSET[c];
        }
        return result;
    }

    // ---------- public API ----------

    // Encode a Bitcoin segwit address (BIP-173).
    //   hrp             : "bc" (mainnet) or "tb" (testnet)
    //   witness_version : 0 for P2WPKH / P2WSH
    //   program         : witness program bytes (20 for P2WPKH, 32 for P2WSH)
    //
    // The encoding prepends the witness version as a 5-bit value, then converts
    // the program from 8-bit to 5-bit groups, and appends a bech32 checksum.
    inline std::string bech32_encode_segwit(const std::string& hrp,
                                            uint8_t witness_version,
                                            const std::vector<uint8_t>& program) {
        if (witness_version > 16) {
            throw std::invalid_argument("bech32_encode_segwit: witness version out of range");
        }
        // BIP-350 requires the bech32m constant (0x2bc830a3) for witness
        // version >= 1 (Taproot P2TR and beyond). This file only implements
        // BIP-173 bech32 with constant 1, which would silently produce
        // addresses that BIP-350-aware wallets and nodes will reject.
        // Fail loudly here so the next person wiring up P2TR has a clear
        // signpost instead of generating invalid addresses.
        if (witness_version > 0) {
            throw std::invalid_argument(
                "bech32_encode_segwit: witness version >= 1 requires bech32m "
                "(BIP-350); this encoder only supports BIP-173 bech32");
        }
        if (program.size() < 2 || program.size() > 40) {
            throw std::invalid_argument("bech32_encode_segwit: program length out of range");
        }

        // Convert 8-bit program bytes to 5-bit groups (with padding).
        std::vector<uint8_t> data5 = convert_bits(program, 8, 5, true);

        // Prepend witness version (already a 5-bit value).
        data5.insert(data5.begin(), witness_version);

        return bech32_encode_raw(hrp, data5);
    }

    // Encode an Avalanche-style bech32 address.
    //   hrp  : "avax" (mainnet) or "fuji" (testnet)
    //   data : raw address bytes (typically 20 bytes)
    //
    // Unlike segwit, there is no witness version prefix.  The data is simply
    // converted from 8-bit to 5-bit groups and a standard bech32 checksum is
    // appended.
    inline std::string bech32_encode_avalanche(const std::string& hrp,
                                               const std::vector<uint8_t>& data) {
        if (data.empty()) {
            throw std::invalid_argument("bech32_encode_avalanche: data must not be empty");
        }

        // Convert 8-bit data to 5-bit groups (with padding).
        std::vector<uint8_t> data5 = convert_bits(data, 8, 5, true);

        return bech32_encode_raw(hrp, data5);
    }

} // namespace margelo::nitro::nitroavalabscrypto

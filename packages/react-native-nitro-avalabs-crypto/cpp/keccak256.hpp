#pragma once

#include <array>
#include <cstdint>
#include <cstring>
#include <vector>

#include <openssl/crypto.h>

namespace margelo::nitro::nitroavalabscrypto {

namespace detail {

static constexpr size_t KECCAK_RATE = 136; // 1088 bits / 8
static constexpr size_t KECCAK_DIGEST = 32; // 256 bits / 8
static constexpr int KECCAK_ROUNDS = 24;

static constexpr uint64_t RC[KECCAK_ROUNDS] = {
    0x0000000000000001ULL, 0x0000000000008082ULL, 0x800000000000808AULL,
    0x8000000080008000ULL, 0x000000000000808BULL, 0x0000000080000001ULL,
    0x8000000080008081ULL, 0x8000000000008009ULL, 0x000000000000008AULL,
    0x0000000000000088ULL, 0x0000000080008009ULL, 0x000000008000000AULL,
    0x000000008000808BULL, 0x800000000000008BULL, 0x8000000000008089ULL,
    0x8000000000008003ULL, 0x8000000000008002ULL, 0x8000000000000080ULL,
    0x000000000000800AULL, 0x800000008000000AULL, 0x8000000080008081ULL,
    0x8000000000008080ULL, 0x0000000080000001ULL, 0x8000000080008008ULL,
};

static constexpr int ROTATION[5][5] = {
    { 0,  1, 62, 28, 27},
    {36, 44,  6, 55, 20},
    { 3, 10, 43, 25, 39},
    {41, 45, 15, 21,  8},
    {18,  2, 61, 56, 14},
};

inline uint64_t rotl64(uint64_t x, int n) {
    // Guard n == 0: shifting a 64-bit value by 64 is undefined behavior.
    // The ROTATION table contains 0 at [0][0].
    return n == 0 ? x : (x << n) | (x >> (64 - n));
}

inline void keccak_f1600(uint64_t state[25]) {
    for (int round = 0; round < KECCAK_ROUNDS; ++round) {
        // Theta
        uint64_t C[5];
        for (int x = 0; x < 5; ++x) {
            C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
        }
        uint64_t D[5];
        for (int x = 0; x < 5; ++x) {
            D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
        }
        for (int i = 0; i < 25; ++i) {
            state[i] ^= D[i % 5];
        }

        // Rho and Pi
        uint64_t B[25];
        for (int x = 0; x < 5; ++x) {
            for (int y = 0; y < 5; ++y) {
                B[y + ((2 * x + 3 * y) % 5) * 5] =
                    rotl64(state[x + y * 5], ROTATION[y][x]);
            }
        }

        // Chi
        for (int x = 0; x < 5; ++x) {
            for (int y = 0; y < 5; ++y) {
                state[x + y * 5] =
                    B[x + y * 5] ^ (~B[(x + 1) % 5 + y * 5] & B[(x + 2) % 5 + y * 5]);
            }
        }

        // Iota
        state[0] ^= RC[round];
    }
}

} // namespace detail

inline std::vector<uint8_t> keccak256(const uint8_t* data, size_t len) {
    static_assert(__BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__,
        "Keccak lane loads assume little-endian byte order");
    uint64_t state[25] = {};

    // Absorb phase
    size_t offset = 0;
    while (len >= detail::KECCAK_RATE) {
        for (size_t i = 0; i < detail::KECCAK_RATE / 8; ++i) {
            uint64_t lane;
            std::memcpy(&lane, data + offset + i * 8, 8);
            state[i] ^= lane;
        }
        detail::keccak_f1600(state);
        offset += detail::KECCAK_RATE;
        len -= detail::KECCAK_RATE;
    }

    // Pad and absorb final block
    // Keccak padding: append 0x01, then zeros, then 0x80 at end of rate block
    uint8_t block[detail::KECCAK_RATE] = {};
    if (len > 0) {
        std::memcpy(block, data + offset, len);
    }
    block[len] = 0x01;
    block[detail::KECCAK_RATE - 1] |= 0x80;

    for (size_t i = 0; i < detail::KECCAK_RATE / 8; ++i) {
        uint64_t lane;
        std::memcpy(&lane, block + i * 8, 8);
        state[i] ^= lane;
    }
    detail::keccak_f1600(state);

    // Squeeze phase (single squeeze for 256-bit output since 256 < 1088)
    std::vector<uint8_t> hash(detail::KECCAK_DIGEST);
    std::memcpy(hash.data(), state, detail::KECCAK_DIGEST);

    // Defensive cleanse of the permutation state and the last-block scratch
    // buffer.  Every CURRENT caller hashes public material (compressed
    // pubkey bytes for EIP-55 / Avalanche bech32 derivation), so there is
    // no secret to protect today.  But the function is positioned in a
    // security-sensitive module and is generic enough that a future caller
    // could feed it secret-derived input.  Zeroing the 25-lane state and
    // the 136-byte block (which holds the final input chunk) costs ~1µs
    // and keeps the function safe-by-default regardless of caller intent.
    // Use OPENSSL_cleanse (rather than std::fill / memset) so the compiler
    // cannot optimize the writes away on an about-to-be-destroyed buffer.
    OPENSSL_cleanse(state, sizeof(state));
    OPENSSL_cleanse(block, sizeof(block));
    return hash;
}

inline std::vector<uint8_t> keccak256(const std::vector<uint8_t>& data) {
    return keccak256(data.data(), data.size());
}

} // namespace margelo::nitro::nitroavalabscrypto

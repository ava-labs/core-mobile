#include "CryptoHybrid.hpp"
#include "address_derivation.hpp"
#include "slip0010.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>
#include <NitroModules/ThreadPool.hpp>
#include <algorithm>
#include <cctype>
#include <cmath>
#include <stdexcept>

#include <openssl/evp.h>
#include <openssl/rand.h>

#ifdef __ANDROID__

#include <android/log.h>

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "CryptoHybrid", __VA_ARGS__)
#else
#define LOGI(...)
#endif

namespace margelo::nitro::nitroavalabscrypto {

    namespace {
        std::once_flag g_once;
        secp256k1_context *g_ctx = nullptr;

        // RAII scope guard — invokes a cleanup lambda on destruction (normal
        // exit *or* exception unwind), ensuring sensitive buffers are always
        // zeroed regardless of the control-flow path taken.
        template<typename F>
        struct ScopeGuard {
            F fn;
            explicit ScopeGuard(F f) : fn(std::move(f)) {}
            ~ScopeGuard() { fn(); }
            ScopeGuard(const ScopeGuard &) = delete;
            ScopeGuard &operator=(const ScopeGuard &) = delete;
        };

        // Validate that every element of a JS number[] (bridged as
        // vector<double>) is a finite, non-negative integer in the
        // non-hardened BIP32/SLIP-0010 range [0, 2^31-1].  Values >= 2^31
        // would collide with the hardened flag (index | 0x80000000) applied
        // internally by the derivation functions, producing ambiguous child
        // numbers and wrong addresses.
        inline void validateAccountIndices(const std::vector<double> &indices) {
            for (size_t i = 0; i < indices.size(); ++i) {
                double v = indices[i];
                if (!std::isfinite(v) || v < 0 || v != std::floor(v) ||
                    v > static_cast<double>(0x7FFFFFFF)) {
                    throw std::invalid_argument(
                        "accountIndices[" + std::to_string(i) +
                        "] is invalid: must be a finite integer in [0, 2^31-1]");
                }
            }
        }

        inline uint8_t hexNibble(char c) {
            if (c >= '0' && c <= '9') return static_cast<uint8_t>(c - '0');
            c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
            if (c >= 'a' && c <= 'f') return static_cast<uint8_t>(10 + (c - 'a'));
            throw std::invalid_argument("Invalid hex character");
        }
    }

    secp256k1_context *CryptoHybrid::ctx() {
        std::call_once(g_once, [] {
            g_ctx = secp256k1_context_create(SECP256K1_CONTEXT_VERIFY | SECP256K1_CONTEXT_SIGN);
            // Randomize the context to protect against side-channel attacks.
            unsigned char seed[32];
            if (RAND_bytes(seed, sizeof(seed)) != 1) {
                // Fall back to unrandomized context if RNG fails — still functional,
                // just without side-channel blinding.
                return;
            }
            (void) secp256k1_context_randomize(g_ctx, seed);
            OPENSSL_cleanse(seed, sizeof(seed));
        });
        return g_ctx;
    }

    std::vector<uint8_t> CryptoHybrid::hexToBytes(const std::string &h) {
        std::string hex = h;
        if (hex.rfind("0x", 0) == 0 || hex.rfind("0X", 0) == 0) hex.erase(0, 2);
        if (hex.size() % 2 != 0) throw std::invalid_argument("Hex string must have even length");
        std::vector<uint8_t> out(hex.size() / 2);
        for (size_t i = 0; i < out.size(); ++i) {
            out[i] = static_cast<uint8_t>((hexNibble(hex[2 * i]) << 4) | hexNibble(hex[2 * i + 1]));
        }
        return out;
    }

    std::vector<uint8_t> CryptoHybrid::bytesFromVariant(const BufferOrString &v) {
        if (std::holds_alternative<std::string>(v)) {
            return hexToBytes(std::get<std::string>(v));
        } else {
            const auto &ab = std::get<std::shared_ptr<ArrayBuffer>>(v);
            if (!ab) throw std::invalid_argument("ArrayBuffer is null");
            auto *p = reinterpret_cast<const uint8_t *>(ab->data());
            return std::vector<uint8_t>(p, p + ab->size());
        }
    }

    std::array<uint8_t, 32> CryptoHybrid::require32(const BufferOrString &v, const char *what) {
        auto bytes = bytesFromVariant(v);
        if (bytes.size() != 32) {
            throw std::invalid_argument(std::string(what) + " must be 32 bytes");
        }
        std::array<uint8_t, 32> out{};
        std::copy(bytes.begin(), bytes.end(), out.begin());
        return out;
    }

    secp256k1_pubkey CryptoHybrid::parsePubkey(const std::vector<uint8_t> &in) {
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

    std::vector<uint8_t>
    CryptoHybrid::serializePubkey(const secp256k1_pubkey &pk, bool compressed) {
        size_t len = compressed ? 33 : 65;
        std::vector<uint8_t> out(len);
        unsigned int flags = compressed ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED;
        if (secp256k1_ec_pubkey_serialize(ctx(), out.data(), &len, &pk, flags) != 1) {
            throw std::runtime_error("Failed to serialize public key");
        }
        out.resize(len);
        return out;
    }

    std::shared_ptr<ArrayBuffer> CryptoHybrid::toAB(const std::vector<uint8_t> &v) {
        auto ab = ArrayBuffer::allocate(v.size());
        std::memcpy(ab->data(), v.data(), v.size());
        return ab;
    }

/* ---------- getPublicKey* (ECDSA-style pubkey from 32-byte seckey) ---------- */

    std::shared_ptr<ArrayBuffer> CryptoHybrid::getPublicKeyFromString(const std::string &secretKey,
                                                                      std::optional<bool> isCompressed) {
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

    std::shared_ptr<ArrayBuffer>
    CryptoHybrid::getPublicKeyFromArrayBuffer(const std::shared_ptr<ArrayBuffer> &secretKey,
                                              std::optional<bool> isCompressed) {
        if (!secretKey) throw std::invalid_argument("secretKey ArrayBuffer is null");
        if (secretKey->size() != 32) throw std::invalid_argument("secretKey must be 32 bytes");
        bool comp = isCompressed.value_or(true);

        const auto *sk = reinterpret_cast<const uint8_t *>(secretKey->data());
        if (secp256k1_ec_seckey_verify(ctx(), sk) != 1)
            throw std::invalid_argument("Invalid secret key");

        secp256k1_pubkey pk{};
        if (secp256k1_ec_pubkey_create(ctx(), &pk, sk) != 1)
            throw std::runtime_error("secp256k1_ec_pubkey_create failed");

        return toAB(serializePubkey(pk, comp));
    }

/* ------------------------ pointAddScalar: P + t·G ------------------------- */

    std::shared_ptr<ArrayBuffer> CryptoHybrid::pointAddScalar(
            const BufferOrString &publicKey,
            const BufferOrString &tweak,
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
            const BufferOrString &secretKey,
            const BufferOrString &message
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
            const BufferOrString &publicKey,
            const BufferOrString &message,
            const BufferOrString &signature
    ) {
        auto pkBytes = bytesFromVariant(publicKey);
        auto msg32 = require32(message, "message");

        secp256k1_pubkey pk = parsePubkey(pkBytes);

        auto sigBytes = bytesFromVariant(signature);
        secp256k1_ecdsa_signature sig{};

        int parsed = 0;
        // Try DER first
        if (!sigBytes.empty()) {
            parsed = secp256k1_ecdsa_signature_parse_der(ctx(), &sig, sigBytes.data(),
                                                         sigBytes.size());
            if (!parsed && sigBytes.size() == 64) {
                // Try compact if 64 bytes
                parsed = secp256k1_ecdsa_signature_parse_compact(ctx(), &sig, sigBytes.data());
            }
        }
        if (!parsed) return false;

        // Normalize (makes high-S equal low-S for verification)
        secp256k1_ecdsa_signature sigNorm = sig;
        (void) secp256k1_ecdsa_signature_normalize(ctx(), &sigNorm, &sig);

        return secp256k1_ecdsa_verify(ctx(), &sigNorm, msg32.data(), &pk) == 1;
    }

/* -------------------------- Schnorr sign/verify --------------------------- */
/* Assumption: messageHash is a 32-byte BIP340 digest; pubkey may be 32-byte xonly
   or 33/65-byte normal EC key (we’ll convert to xonly). */

    std::shared_ptr<ArrayBuffer> CryptoHybrid::signSchnorr(
            const BufferOrString &secretKey,
            const BufferOrString &messageHash,
            const BufferOrString &auxRand
    ) {
        auto sk = require32(secretKey, "secretKey");
        auto msg32 = require32(messageHash, "messageHash");
        auto aux32 = require32(auxRand, "auxRand");

        if (secp256k1_ec_seckey_verify(ctx(), sk.data()) != 1)
            throw std::invalid_argument("Invalid secret key");

        secp256k1_keypair keypair;
        if (secp256k1_keypair_create(ctx(), &keypair, sk.data()) != 1)
            throw std::runtime_error("keypair_create failed");

        std::array<unsigned char, 64> sig64{};
        if (secp256k1_schnorrsig_sign32(ctx(), sig64.data(), msg32.data(), &keypair,
                                        aux32.data()) != 1)
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

        return toAB(std::vector<uint8_t>(sig64.begin(), sig64.end()));
    }

    bool CryptoHybrid::verifySchnorr(
            const BufferOrString &publicKey,
            const BufferOrString &messageHash,
            const BufferOrString &signature
    ) {
        auto msg32 = require32(messageHash, "messageHash");
        auto sig = bytesFromVariant(signature);
        if (sig.size() != 64) return false;

        auto pkBytes = bytesFromVariant(publicKey);
        secp256k1_xonly_pubkey xpk{};
        if (pkBytes.size() == 32) {
            if (secp256k1_xonly_pubkey_parse(ctx(), &xpk, pkBytes.data()) != 1) return false;
        } else {
            try {
                secp256k1_pubkey full = parsePubkey(pkBytes);
                int parity = 0;
                if (secp256k1_xonly_pubkey_from_pubkey(ctx(), &xpk, &parity, &full) != 1)
                    return false;
            } catch (...) { return false; }
        }

        return secp256k1_schnorrsig_verify(ctx(), sig.data(), msg32.data(), 32, &xpk) == 1;
    }

/* ------------------------- Ed25519 Extended Public Key ------------------------- */
/* Implements Ed25519 extended public key derivation using HYBRID approach.
 * 
 * HYBRID ARCHITECTURE for web wallet compatibility:
 * - C++ (this function): SHA-512 hash + clamp head bytes (fast native operations)
 * - TypeScript wrapper: Modular reduction + point derivation using @noble/curves
 * 
 * This ensures the point derivation matches the web wallet exactly while still
 * getting native performance for the expensive SHA-512 hashing.
 * 
 * Returns:
 * {
 *   head: Uint8Array,      // CLAMPED first 32 bytes from SHA-512
 *   prefix: Uint8Array,    // Last 32 bytes from SHA-512
 *   scalar: string,        // Hex string of clamped head (TypeScript applies modulo)
 *   pointBytes: Uint8Array // Empty (filled by TypeScript using @noble/curves)
 * }
 */

    ExtendedPublicKey
    CryptoHybrid::getExtendedPublicKey(const BufferOrString &secretKey) {
        // Input validation
        auto sk32 = require32(secretKey, "secretKey");

        // Step 1: Hash secret key with SHA-512
        std::array<uint8_t, 64> hash64{};
        EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
        if (!mdctx) {
            throw std::runtime_error("Ed25519: EVP_MD_CTX_new failed");
        }

        if (EVP_DigestInit_ex(mdctx, EVP_sha512(), nullptr) != 1) {
            EVP_MD_CTX_free(mdctx);
            throw std::runtime_error("Ed25519: EVP_DigestInit_ex failed");
        }

        if (EVP_DigestUpdate(mdctx, sk32.data(), 32) != 1) {
            EVP_MD_CTX_free(mdctx);
            throw std::runtime_error("Ed25519: EVP_DigestUpdate failed");
        }

        unsigned int hashLen = 64;
        if (EVP_DigestFinal_ex(mdctx, hash64.data(), &hashLen) != 1 || hashLen != 64) {
            EVP_MD_CTX_free(mdctx);
            throw std::runtime_error("Ed25519: SHA-512 failed");
        }
        EVP_MD_CTX_free(mdctx);

        // Step 2: Extract head and prefix from SHA-512 hash
        std::array<uint8_t, 32> headUnclamped{};
        std::array<uint8_t, 32> prefix{};
        std::copy(hash64.begin(), hash64.begin() + 32, headUnclamped.begin());
        std::copy(hash64.begin() + 32, hash64.end(), prefix.begin());

        // Step 3: Clamp the head (RFC 8032 section 5.1.5)
        // This matches @noble/curves adjustScalarBytes(hashed.slice(0, len))
        std::array<uint8_t, 32> head = headUnclamped;  // This will be the clamped version
        head[0] &= 0xf8;   // Clear bottom 3 bits (ensure multiple of 8)
        head[31] &= 0x7f;  // Clear top bit (ensure < 2^255)
        head[31] |= 0x40;  // Set second-highest bit (ensure >= 2^254)

        // Step 4: Convert CLAMPED head to scalar hex string for TypeScript
        // TypeScript will:
        // 1. Apply modular reduction: scalar % ED25519_ORDER
        // 2. Derive point using @noble/curves: point = BASE.multiply(scalar)
        // This hybrid approach ensures web wallet compatibility
        std::array<uint8_t, 32> headBE{};
        std::reverse_copy(head.begin(), head.end(), headBE.begin());
        std::string scalarStr = "0x" + to_hex(headBE.data(), 32);
        
        // Step 5: Return empty pointBytes - point derivation happens in TypeScript
        // C++ only does the expensive SHA-512 hash and clamping
        std::array<uint8_t, 32> pointBytes{};  // Empty, filled by TypeScript
        
        auto headAB = toAB(std::vector<uint8_t>(head.begin(), head.end()));
        auto prefixAB = toAB(std::vector<uint8_t>(prefix.begin(), prefix.end()));
        auto pointBytesAB = toAB(std::vector<uint8_t>(pointBytes.begin(), pointBytes.end()));

        return ExtendedPublicKey(headAB, prefixAB, scalarStr, pointBytesAB);
    }

/* -------------------- Batch Address Derivation (async) -------------------- */

    std::shared_ptr<Promise<std::vector<DerivedSecp256k1Addresses>>>
    CryptoHybrid::deriveAddressesFromXpubs(
            const std::string &evmXpub,
            const std::vector<std::string> &avalancheXpubs,
            bool isTestnet,
            const std::vector<double> &accountIndices) {

        if (avalancheXpubs.size() != accountIndices.size()) {
            throw std::invalid_argument(
                "avalancheXpubs and accountIndices must have the same length");
        }
        validateAccountIndices(accountIndices);

        return Promise<std::vector<DerivedSecp256k1Addresses>>::async(
            [evmXpub, avalancheXpubs, isTestnet, accountIndices]() {

            auto evm_parsed = parse_xpub(evmXpub);

            std::vector<DerivedSecp256k1Addresses> results;
            results.reserve(accountIndices.size());

            for (size_t i = 0; i < accountIndices.size(); ++i) {
                auto index = static_cast<uint32_t>(accountIndices[i]);
                auto avax_parsed = parse_xpub(avalancheXpubs[i]);
                auto addrs = derive_addresses_for_index(
                    CryptoHybrid::ctx(), evm_parsed, avax_parsed, isTestnet, index);

                results.push_back(DerivedSecp256k1Addresses(
                    accountIndices[i],
                    std::move(addrs.evm),
                    std::move(addrs.btc),
                    std::move(addrs.avm),
                    std::move(addrs.pvm),
                    std::move(addrs.coreEth)
                ));
            }

            return results;
        });
    }

/* --------------- Batch Solana Address Derivation (async) --------------- */

    std::shared_ptr<Promise<std::vector<DerivedSolanaAddress>>>
    CryptoHybrid::deriveSolanaAddressesFromSeed(
            const std::shared_ptr<ArrayBuffer> &seed,
            const std::vector<double> &accountIndices) {

        if (!seed || seed->size() != 64) {
            throw std::invalid_argument("seed must be a 64-byte ArrayBuffer");
        }
        validateAccountIndices(accountIndices);

        // Copy seed bytes so the lambda owns them (the ArrayBuffer may be
        // invalidated before the background thread runs).
        std::vector<uint8_t> seedBytes(64);
        std::memcpy(seedBytes.data(), seed->data(), 64);

        return Promise<std::vector<DerivedSolanaAddress>>::async(
            [seedBytes = std::move(seedBytes), accountIndices]() mutable {

            // Scope guard: zero seed bytes on *any* exit path, including
            // exceptions thrown during the derivation loop.
            ScopeGuard cleanupSeed([&] {
                OPENSSL_cleanse(seedBytes.data(), seedBytes.size());
            });

            // Compute SLIP-0010 master once — reused across all accounts.
            auto master = slip0010_master_key(seedBytes.data(), seedBytes.size());
            ScopeGuard cleanupMaster([&] {
                OPENSSL_cleanse(master.secret.data(), master.secret.size());
                OPENSSL_cleanse(master.chain_code.data(), master.chain_code.size());
            });

            std::vector<DerivedSolanaAddress> results;
            results.reserve(accountIndices.size());

            for (double idx : accountIndices) {
                auto index = static_cast<uint32_t>(idx);
                auto address = solana_address_from_master(master, index);

                results.push_back(DerivedSolanaAddress(idx, std::move(address)));
            }

            return results;
        });
    }

/* ---------- All Addresses From Seed (secp256k1 + Ed25519, async) --------- */

    std::shared_ptr<Promise<std::vector<DerivedAllAddresses>>>
    CryptoHybrid::deriveAllAddressesFromSeed(
            const std::shared_ptr<ArrayBuffer> &seed,
            const std::vector<double> &accountIndices,
            bool isTestnet) {

        if (!seed || seed->size() != 64) {
            throw std::invalid_argument("seed must be a 64-byte ArrayBuffer");
        }
        validateAccountIndices(accountIndices);

        std::vector<uint8_t> seedBytes(64);
        std::memcpy(seedBytes.data(), seed->data(), 64);

        return Promise<std::vector<DerivedAllAddresses>>::async(
            [seedBytes = std::move(seedBytes), accountIndices, isTestnet]() mutable {

            // Protect seedBytes immediately — every subsequent derivation
            // step has its own guard so sensitive material is zeroed even if
            // an earlier step throws.
            ScopeGuard cleanupSeed([&] {
                OPENSSL_cleanse(seedBytes.data(), seedBytes.size());
            });

            auto *sctx = CryptoHybrid::ctx();

            // BIP32 master from seed (once)
            auto master = bip32_master_from_seed(seedBytes.data(), seedBytes.size());
            ScopeGuard cleanupMaster([&] {
                OPENSSL_cleanse(master.key.data(), master.key.size());
                OPENSSL_cleanse(master.chain_code.data(), master.chain_code.size());
            });

            // EVM xpub at m/44'/60'/0' (once — shared across all accounts)
            auto evm_priv = bip32_derive_hardened_path(sctx, master, {44, 60, 0});
            auto evm_xpub = bip32_private_to_public(sctx, evm_priv);
            // Zero the EVM private key — only the public key is needed from here.
            OPENSSL_cleanse(evm_priv.key.data(), evm_priv.key.size());
            OPENSSL_cleanse(evm_priv.chain_code.data(), evm_priv.chain_code.size());

            // SLIP-0010 master for Solana (once — shared across all accounts)
            auto sol_master = slip0010_master_key(seedBytes.data(), seedBytes.size());
            ScopeGuard cleanupSolana([&] {
                OPENSSL_cleanse(sol_master.secret.data(), sol_master.secret.size());
                OPENSSL_cleanse(sol_master.chain_code.data(), sol_master.chain_code.size());
            });

            std::vector<DerivedAllAddresses> results;
            results.reserve(accountIndices.size());

            for (double idx : accountIndices) {
                auto index = static_cast<uint32_t>(idx);

                // secp256k1 addresses (EVM, BTC, AVM, PVM, CoreEth)
                auto addrs = derive_all_addresses_for_index(
                    sctx, master, evm_xpub,
                    isTestnet, index);

                // Solana address (SLIP-0010 Ed25519) — uses pre-computed master
                auto solana = solana_address_from_master(sol_master, index);

                results.push_back(DerivedAllAddresses(
                    idx,
                    std::move(addrs.evm),
                    std::move(addrs.btc),
                    std::move(addrs.avm),
                    std::move(addrs.pvm),
                    std::move(addrs.coreEth),
                    std::move(solana)
                ));
            }

            return results;
        });
    }

} // namespace margelo::nitro::nitroavalabscrypto
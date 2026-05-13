#include "CryptoHybrid.hpp"
#include "address_derivation.hpp"
#include "slip0010.hpp"
#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>
#include <NitroModules/ThreadPool.hpp>
#include <algorithm>
#include <atomic>
#include <cctype>
#include <cmath>
#include <exception>
#include <mutex>
#include <stdexcept>
#include <thread>
#include <utility>

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

        // Use the shared scope guard from scope_guard.hpp (transitively
        // included via address_derivation.hpp / slip0010.hpp). The previous
        // local definition has been removed to keep the template in one
        // place and avoid drift between callers.
        using detail::ScopeGuard;

        // Validate that every element of a JS number[] (bridged as
        // vector<double>) is a finite, non-negative integer in the
        // non-hardened BIP32/SLIP-0010 range [0, 2^31-1].  Values >= 2^31
        // would collide with the hardened flag (index | 0x80000000) applied
        // internally by the derivation functions, producing ambiguous child
        // numbers and wrong addresses.
        // Hard upper bound on how many account indices a single batch-derive
        // call will accept.  Each entry triggers BIP-32 derivation work plus
        // a ~300-byte DerivedSecp256k1Addresses / DerivedAllAddresses result
        // — at 1M entries that's ~300 MB and ~12 s on-thread, easily an OOM
        // on memory-constrained devices.  No real wallet derives anywhere
        // near 1024 accounts; this cap exists purely as a sanity guard
        // against buggy or malicious JS callers.  Bump if a legitimate
        // use case ever needs more.
        static constexpr size_t MAX_ACCOUNT_INDICES_PER_CALL = 1024;

        inline void validateAccountIndices(const std::vector<double> &indices) {
            if (indices.size() > MAX_ACCOUNT_INDICES_PER_CALL) {
                throw std::invalid_argument(
                    "accountIndices: batch size " + std::to_string(indices.size()) +
                    " exceeds maximum of " +
                    std::to_string(MAX_ACCOUNT_INDICES_PER_CALL) +
                    " — split into multiple calls if you genuinely need this many");
            }
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

        // Run `fn(i)` for i in [0, n) across hardware_concurrency() worker
        // threads, partitioning the index range into contiguous chunks so each
        // worker writes only its own slots (no synchronization needed inside
        // fn). Exceptions thrown by fn are captured; the first one is rethrown
        // on the calling thread after all workers join.
        //
        // CONTRACT: `fn` MUST be thread-safe under concurrent calls with
        // distinct `i` values.  Workers all invoke the SAME captured `fn`
        // concurrently; a stateful `fn` (e.g. `[counter = 0]() mutable { … }`)
        // would silently race.  Our call sites pass stateless lambdas that
        // read shared state and write to disjoint result slots — anything
        // else needs explicit synchronization inside `fn`.
        //
        // EXCEPTION POLICY: only the FIRST throwing worker's exception is
        // preserved (`failed.exchange(true)` gates the write).  Subsequent
        // concurrent throws are silently dropped on the worker side.  This
        // is acceptable because the worker pool is treated as failing-fast
        // as a unit, but it does hide independent failures if multiple
        // workers throw for different reasons.
        //
        // Single-worker (n <= 1 or single-core) path bypasses thread creation.
        template <typename Fn>
        inline void parallelFor(size_t n, Fn &&fn) {
            const size_t hw =
                std::max<size_t>(1, std::thread::hardware_concurrency());
            const size_t numWorkers = std::min(hw, n);

            if (numWorkers <= 1) {
                for (size_t i = 0; i < n; ++i) fn(i);
                return;
            }

            std::vector<std::thread> workers;
            workers.reserve(numWorkers);
            std::atomic<bool> failed{false};
            std::mutex errMutex;
            // Capture the first thrown exception via exception_ptr so the
            // original type (e.g. std::invalid_argument vs std::runtime_error)
            // is preserved when rethrown on the calling thread. catch(...)
            // also covers foreign exceptions — an uncaught exception escaping
            // a std::thread would call std::terminate.
            std::exception_ptr errPtr;

            const size_t chunk = (n + numWorkers - 1) / numWorkers;
            for (size_t w = 0; w < numWorkers; ++w) {
                const size_t start = w * chunk;
                const size_t end = std::min(start + chunk, n);
                if (start >= end) break;
                workers.emplace_back([&, start, end]() {
                    try {
                        for (size_t i = start; i < end; ++i) {
                            if (failed.load(std::memory_order_relaxed)) return;
                            fn(i);
                        }
                    } catch (...) {
                        if (!failed.exchange(true)) {
                            std::lock_guard<std::mutex> g(errMutex);
                            errPtr = std::current_exception();
                        }
                    }
                });
            }

            for (auto &t : workers) t.join();

            if (errPtr) {
                std::rethrow_exception(errPtr);
            }
        }
    }

    secp256k1_context *CryptoHybrid::ctx() {
        // Process-lifetime singleton. `secp256k1_context_destroy(g_ctx)` is
        // intentionally never called — the context is needed for the entire
        // lifetime of the app, and at process exit the OS reclaims the page.
        // libsecp256k1 documents its const-context API as safe for concurrent
        // use after init, which is what we rely on inside `parallelFor`.
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
        // Read the optional "0x"/"0X" prefix as an offset rather than allocating
        // a mutated copy of the input — when the input is a secret-key hex, a
        // copy would strand cleartext on the heap that we never get to cleanse.
        size_t off = 0;
        if (h.size() >= 2 && h[0] == '0' && (h[1] == 'x' || h[1] == 'X')) {
            off = 2;
        }
        const size_t hexLen = h.size() - off;
        if (hexLen % 2 != 0) {
            throw std::invalid_argument("Hex string must have even length");
        }
        std::vector<uint8_t> out(hexLen / 2);
        for (size_t i = 0; i < out.size(); ++i) {
            out[i] = static_cast<uint8_t>(
                (hexNibble(h[off + 2 * i]) << 4) | hexNibble(h[off + 2 * i + 1]));
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
        // Cleanse the intermediate vector regardless of size — when the caller
        // is on a secret-key path, `bytes` carries cleartext that must not
        // outlive this function (the vector's heap may be reused immediately
        // after destruction).
        if (bytes.size() != 32) {
            OPENSSL_cleanse(bytes.data(), bytes.size());
            throw std::invalid_argument(std::string(what) + " must be 32 bytes");
        }
        std::array<uint8_t, 32> out{};
        std::copy(bytes.begin(), bytes.end(), out.begin());
        OPENSSL_cleanse(bytes.data(), bytes.size());
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
        // Verify both the return code AND the written length, matching the
        // pattern in address_derivation.hpp. libsecp256k1 documents the call
        // as always returning 1 and writing exactly 33 / 65 bytes, but a
        // mismatched length would silently shrink the output via the
        // previous `out.resize(len)` and hand callers a malformed SEC1
        // buffer.
        const size_t expected = compressed ? 33u : 65u;
        size_t len = expected;
        std::vector<uint8_t> out(len);
        unsigned int flags = compressed ? SECP256K1_EC_COMPRESSED : SECP256K1_EC_UNCOMPRESSED;
        if (secp256k1_ec_pubkey_serialize(ctx(), out.data(), &len, &pk, flags) != 1
            || len != expected) {
            throw std::runtime_error(
                "serializePubkey: failed to serialize public key");
        }
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
        // Cleanse on every return path — `sk` is the decoded private key.
        ScopeGuard cleanseSk([&] { OPENSSL_cleanse(sk.data(), sk.size()); });
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
        // Cleanse on every return path (normal return + exception unwind).
        ScopeGuard cleanseSk([&] { OPENSSL_cleanse(sk.data(), sk.size()); });
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

        // Normalize (makes high-S equal low-S for verification).
        // The return code is intentionally ignored: 1 means normalization was
        // applied, 0 means the signature was already in low-S form — either
        // way `sigNorm` is valid for verification.
        //
        // NOTE: this means we silently accept malleable high-S signatures by
        // verifying their low-S equivalent.  Bitcoin (BIP-62) and Ethereum
        // (EIP-2) require strict low-S rejection.  Callers that need that
        // policy must reject high-S signatures themselves at a higher layer
        // — this primitive intentionally implements the more permissive
        // verification rule that matches generic libsecp256k1 semantics.
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
        ScopeGuard cleanseSk([&] { OPENSSL_cleanse(sk.data(), sk.size()); });
        auto msg32 = require32(messageHash, "messageHash");
        auto aux32 = require32(auxRand, "auxRand");

        if (secp256k1_ec_seckey_verify(ctx(), sk.data()) != 1)
            throw std::invalid_argument("Invalid secret key");

        secp256k1_keypair keypair;
        // secp256k1_keypair stores the secret key internally; zero its bytes on
        // every return path, not just success.
        ScopeGuard cleanseKeypair([&] { OPENSSL_cleanse(&keypair, sizeof(keypair)); });
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
        ScopeGuard cleanseSk([&] { OPENSSL_cleanse(sk32.data(), sk32.size()); });

        // Step 1: Hash secret key with SHA-512
        std::array<uint8_t, 64> hash64{};
        // SHA-512 output is derived directly from the secret — treat as
        // secret-equivalent on every return path.
        ScopeGuard cleanseHash([&] { OPENSSL_cleanse(hash64.data(), hash64.size()); });
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

        // Step 4: Scalar derivation is now done in TypeScript directly from
        // `head` — JS reverses the little-endian bytes to big-endian and
        // parses as a BigInt, then applies the mod-L reduction. Keeping the
        // scalar out of the C++→JS string bridge eliminates the only path
        // where a secret-derived value crossed as an immutable JS string
        // (which we cannot zero from C++ once interned by the JS engine).
        // The `scalar` field in the returned struct remains for ABI stability
        // but is intentionally empty.
        std::string scalarStr;

        // Step 5: Return empty pointBytes — point derivation happens in TS
        // using @noble/curves on top of the head bytes.
        std::array<uint8_t, 32> pointBytes{};  // Empty, filled by TypeScript

        auto headAB = toAB(std::vector<uint8_t>(head.begin(), head.end()));
        auto prefixAB = toAB(std::vector<uint8_t>(prefix.begin(), prefix.end()));
        auto pointBytesAB = toAB(std::vector<uint8_t>(pointBytes.begin(), pointBytes.end()));

        // Cleanse the secret-derived local arrays once the ArrayBuffers above
        // have an independent copy. The returned head/prefix ArrayBuffers
        // intentionally carry secret-derived bytes to JS; this only zeros our
        // local copies so the stack frame doesn't strand them after return.
        OPENSSL_cleanse(headUnclamped.data(), headUnclamped.size());
        OPENSSL_cleanse(prefix.data(), prefix.size());
        OPENSSL_cleanse(head.data(), head.size());

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

            // Pre-parse all avalanche xpubs once. parse_xpub is base58check
            // decode + double-SHA256 + 78-byte unpack — redoing it per loop
            // iteration was O(N) wasted work.
            std::vector<Xpub> avax_parsed;
            avax_parsed.reserve(avalancheXpubs.size());
            for (const auto &s : avalancheXpubs) {
                avax_parsed.push_back(parse_xpub(s));
            }

            const size_t n = accountIndices.size();
            std::vector<DerivedSecp256k1Addresses> results(n);

            auto deriveOne = [&](size_t i) {
                auto index = static_cast<uint32_t>(accountIndices[i]);
                auto addrs = derive_addresses_for_index(
                    CryptoHybrid::ctx(), evm_parsed, avax_parsed[i],
                    isTestnet, index);
                results[i] = DerivedSecp256k1Addresses(
                    accountIndices[i],
                    std::move(addrs.evm),
                    std::move(addrs.btc),
                    std::move(addrs.avm),
                    std::move(addrs.pvm),
                    std::move(addrs.coreEth));
            };

            // Each account is independent (per-account avalanche xpub, EVM
            // child index varies); libsecp256k1 documents its const-context
            // API as safe for concurrent use, and our OpenSSL EVP / HMAC
            // calls each create their own context per invocation.
            parallelFor(n, deriveOne);

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

        // Use CleansingArray<64> rather than std::vector<uint8_t>(64) so the
        // seed bytes are cleansed via the buffer's destructor regardless of
        // whether the async lambda below ever actually runs.  A plain
        // std::vector captured-by-move would leak the secret on the freed
        // allocator slab if the Promise is dropped before dispatch (e.g.
        // process teardown, JS engine shutdown).
        detail::CleansingArray<64> seedBytes;
        std::memcpy(seedBytes.data(), seed->data(), 64);

        return Promise<std::vector<DerivedAllAddresses>>::async(
            [seedBytes = std::move(seedBytes), accountIndices, isTestnet]() mutable {

            // No explicit cleanse needed for seedBytes — CleansingArray's
            // destructor handles it.  The per-step guards below still cover
            // the derived intermediates (master, evm_xpub, sol_master), which
            // are stack-local inside this lambda and only exist if the lambda
            // actually runs.
            auto *sctx = CryptoHybrid::ctx();

            // BIP32 master from seed (once)
            auto master = bip32_master_from_seed(seedBytes.data(), seedBytes.size());
            ScopeGuard cleanupMaster([&] {
                OPENSSL_cleanse(master.key.data(), master.key.size());
                OPENSSL_cleanse(master.chain_code.data(), master.chain_code.size());
            });

            // EVM xpub at m/44'/60'/0' (once — shared across all accounts).
            // bip32_derive_hardened_xpub_path cleanses the intermediate
            // private key internally on every exit path (incl. exception
            // unwind), so there's no secret material to manage here.
            auto evm_xpub = bip32_derive_hardened_xpub_path(
                sctx, master, {44, 60, 0});

            // SLIP-0010 master for Solana (once — shared across all accounts)
            auto sol_master = slip0010_master_key(seedBytes.data(), seedBytes.size());
            ScopeGuard cleanupSolana([&] {
                OPENSSL_cleanse(sol_master.secret.data(), sol_master.secret.size());
                OPENSSL_cleanse(sol_master.chain_code.data(), sol_master.chain_code.size());
            });

            const size_t n = accountIndices.size();
            std::vector<DerivedAllAddresses> results(n);

            auto deriveOne = [&](size_t i) {
                auto idx = accountIndices[i];
                auto index = static_cast<uint32_t>(idx);

                // secp256k1 addresses (EVM, BTC, AVM, PVM, CoreEth)
                auto addrs = derive_all_addresses_for_index(
                    sctx, master, evm_xpub, isTestnet, index);

                // Solana address (SLIP-0010 Ed25519) — uses pre-computed master
                auto solana = solana_address_from_master(sol_master, index);

                results[i] = DerivedAllAddresses(
                    idx,
                    std::move(addrs.evm),
                    std::move(addrs.btc),
                    std::move(addrs.avm),
                    std::move(addrs.pvm),
                    std::move(addrs.coreEth),
                    std::move(solana));
            };

            // `master`, `evm_xpub`, and `sol_master` are read-only from here
            // (each derivation copies master state before mutating it), so
            // per-account work is independent and parallel-safe.
            parallelFor(n, deriveOne);

            return results;
        });
    }

/* ------- All Addresses From a Raw Private Key — secp256k1 + Ed25519 ------ */
/* Used by the imported-private-key flow.  The same 32 bytes feed two
 * different curves:
 *
 *   - secp256k1 (BIP-32 / SEC1) → EVM, BTC, AVM, PVM, CoreEth
 *   - Ed25519 (RFC 8032 §5.1.5)  → Solana
 *
 * There is no derivation tree — the raw secret is used directly on each
 * curve, mirroring Core Extension's WalletService PrivateKey path. */

    DerivedAllAddresses CryptoHybrid::deriveAllAddressesFromPrivateKey(
            const std::shared_ptr<ArrayBuffer> &privateKey,
            bool isTestnet) {

        if (!privateKey || privateKey->size() != 32) {
            throw std::invalid_argument("privateKey must be a 32-byte ArrayBuffer");
        }

        // Copy the secret out of the JS-owned ArrayBuffer into a local
        // std::array so we can OPENSSL_cleanse our copy on every return path
        // — including exception unwind from any of the encoder helpers.
        std::array<uint8_t, 32> sk{};
        std::memcpy(sk.data(), privateKey->data(), 32);
        ScopeGuard cleanseSk([&] { OPENSSL_cleanse(sk.data(), sk.size()); });

        auto *sctx = CryptoHybrid::ctx();

        // ---- secp256k1: EVM / BTC / AVM / PVM / CoreEth ----
        if (secp256k1_ec_seckey_verify(sctx, sk.data()) != 1) {
            throw std::invalid_argument("Invalid secret key");
        }

        secp256k1_pubkey pk{};
        if (secp256k1_ec_pubkey_create(sctx, &pk, sk.data()) != 1) {
            throw std::runtime_error("secp256k1_ec_pubkey_create failed");
        }

        auto compressed = serializePubkey(pk, true);

        const std::string avax_hrp = isTestnet ? "fuji" : "avax";
        auto evm = evm_address_from_pubkey(sctx, compressed);
        auto btc = btc_address_from_pubkey(compressed, isTestnet);
        auto avax_bech32 = avalanche_bech32_from_pubkey(compressed, avax_hrp);

        // ---- Ed25519: Solana ----
        // ed25519_public_key (slip0010.hpp) wraps OpenSSL's raw Ed25519 API
        // — EVP_PKEY_new_raw_private_key + EVP_PKEY_get_raw_public_key —
        // which is RFC 8032 §5.1.5 (SHA-512 + clamp + scalar × base) in one
        // call.  Matches `@noble/curves/ed25519`.getPublicKey(secret) and
        // therefore matches `PrivateKeyWallet.getPublicKeyFor(Curve.ED25519)`
        // and `SolanaSigner` byte-for-byte.
        auto ed_pub = ed25519_public_key(sk);
        std::string solana = base58_encode(
            std::vector<uint8_t>(ed_pub.begin(), ed_pub.end()));

        return DerivedAllAddresses(
            0.0,  // accountIndex N/A for a raw imported key — kept for ABI parity
            std::move(evm),
            std::move(btc),
            "X-" + avax_bech32,
            "P-" + avax_bech32,
            "C-" + avax_bech32,
            std::move(solana));
    }

} // namespace margelo::nitro::nitroavalabscrypto
#include "CryptoHybrid.hpp"
#include "address_derivation.hpp"
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
        // included via address_derivation.hpp). The previous local
        // definition has been removed to keep the template in one place
        // and avoid drift between callers.
        using detail::ScopeGuard;

        // Validate that every element of a JS number[] (bridged as
        // vector<double>) is a finite, non-negative integer in the
        // non-hardened BIP32/SLIP-0010 range [0, 2^31-1].  Values >= 2^31
        // would collide with the hardened flag (index | 0x80000000) applied
        // internally by the derivation functions, producing ambiguous child
        // numbers and wrong addresses.
        // Hard upper bound on how many account indices a single batch-derive
        // call will accept. No real wallet derives anywhere near 1024
        // accounts in one request; this cap exists purely as a sanity guard
        // against buggy or malicious JS callers and to bound CPU/memory work
        // per call. Bump if a legitimate use case ever needs more.
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

        // Bound the per-call batch size for the synchronous per-chain
        // address-derivation methods. They block the JS thread for the
        // duration of the call (no Promise::async), so a buggy or hostile
        // caller passing N=10k+ pubkeys would freeze the UI for seconds.
        // Mirrors `MAX_ACCOUNT_INDICES_PER_CALL` used by the async
        // `deriveAddressesFromXpubs`. Real wallets never come close to
        // 1024 accounts in one request — bump if a legitimate use case
        // ever needs more.
        inline void validatePubkeyBatchSize(size_t n, const char *what) {
            if (n > MAX_ACCOUNT_INDICES_PER_CALL) {
                throw std::invalid_argument(
                    std::string(what) + ": batch size " + std::to_string(n) +
                    " exceeds maximum of " +
                    std::to_string(MAX_ACCOUNT_INDICES_PER_CALL) +
                    " — split into multiple calls if you genuinely need this many");
            }
        }

        inline uint8_t hexNibble(char c) {
            if (c >= '0' && c <= '9') return static_cast<uint8_t>(c - '0');
            c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
            if (c >= 'a' && c <= 'f') return static_cast<uint8_t>(10 + (c - 'a'));
            throw std::invalid_argument("Invalid hex character");
        }

        // Run `fn(i)` for i in [0, n) across up to kMaxWorkers worker threads
        // using a work-stealing scheduler: every worker pulls the next index
        // from a shared atomic counter, so uneven per-item costs don't strand
        // a worker holding leftover items while siblings sit idle. Each call
        // to `fn` sees a unique `i`, so as long as `fn` writes to disjoint
        // result slots no synchronization is needed inside `fn`. Exceptions
        // thrown by fn are captured; the first one is rethrown on the calling
        // thread after all workers join.
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
        // FAIL-FAST IS COOPERATIVE, NOT INSTANT: the per-iteration check
        // uses `memory_order_relaxed`, and the original thrower flips
        // `failed` AFTER `fn` returns (i.e. inside catch). Sibling workers
        // can therefore execute several extra `fn(i)` invocations between
        // the first throw and observing the flag. This is fine as long as
        // `fn` is idempotent for distinct `i` values — exactly the contract
        // already required above. If `fn` ever needs "must not run after
        // first error" semantics (e.g. side-effecting writes), tighten the
        // ordering here or add a per-iteration abort check inside `fn`.
        //
        // RESULT-VECTOR CONTRACT FOR CALLERS: when `fn` writes to a shared
        // result vector indexed by `i`, slots not yet visited at the moment
        // a worker short-circuits will remain default-constructed (empty
        // strings, zeroed structs, etc.). Because `parallelFor` rethrows
        // immediately after `join`, those gaps NEVER propagate out on a
        // successful path — the rethrow causes the caller's promise/lambda
        // to exit with the exception, and the result vector is destroyed.
        // Callers MUST NOT consult the result vector after `parallelFor`
        // throws. The TS-side wrappers document this as an "all-or-nothing"
        // contract for JS consumers; preserve that invariant if you ever
        // change `parallelFor`'s exception handling.
        //
        // Single-worker (n <= 1 or single-core) path bypasses thread creation.
        //
        // BATCH-SIZE TUNING: callers typically pass n in [1, 20] (account
        // discovery window). Two caps keep small batches from paying full
        // pthread_create + 1 MB stack reservation × hardware_concurrency:
        //   * kSmallBatchSerial — below this, run serially; the overhead of
        //     spawning even one extra thread exceeds the saved work.
        //   * kMaxWorkers — cap parallelism even when hw is higher; on mobile
        //     big.LITTLE SoCs (typ. 4 perf + 4 efficiency cores), spreading
        //     past ~4 workers schedules onto efficiency cores that run each
        //     worker slower, so wall-clock gains flatten. Raise only if
        //     `parallelFor` ever ingests large (n >> 20) batches.
        template <typename Fn>
        inline void parallelFor(size_t n, Fn &&fn) {
            constexpr size_t kSmallBatchSerial = 2;
            constexpr size_t kMaxWorkers = 4;

            if (n <= kSmallBatchSerial) {
                for (size_t i = 0; i < n; ++i) fn(i);
                return;
            }

            const size_t hw =
                std::max<size_t>(1, std::thread::hardware_concurrency());
            const size_t numWorkers = std::min({hw, n, kMaxWorkers});

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

            // Work-stealing scheduler: workers race to claim the next index
            // from a shared atomic counter. Replaces an earlier chunked
            // partition (`(n + numWorkers - 1) / numWorkers`) that could
            // both leave later workers empty when `n % numWorkers != 0` and,
            // more importantly, strand the slowest chunk's worker holding
            // leftover items while siblings sat idle. The atomic fetch_add
            // cost (~10ns) is well below noise for the crypto-heavy work
            // this function serves (µs-to-100µs per index).
            std::atomic<size_t> next{0};
            for (size_t w = 0; w < numWorkers; ++w) {
                workers.emplace_back([&]() {
                    try {
                        for (;;) {
                            if (failed.load(std::memory_order_relaxed)) return;
                            const size_t i =
                                next.fetch_add(1, std::memory_order_relaxed);
                            if (i >= n) return;
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
            // Throw before std::call_once marks the flag completed — the throw
            // propagates out of call_once and leaves the once-flag un-set, so
            // a subsequent call retries initialization rather than dereferencing
            // a cached nullptr.
            if (g_ctx == nullptr) {
                throw std::runtime_error("secp256k1_context_create failed");
            }
            // Randomize the context to protect against side-channel attacks.
            // ScopeGuard ensures the seed buffer is cleansed on every exit path
            // — including the early return below if RAND_bytes fails — so the
            // cleanse contract holds regardless of how this lambda exits.
            unsigned char seed[32];
            ScopeGuard cleanseSeed([&] { OPENSSL_cleanse(seed, sizeof(seed)); });
            if (RAND_bytes(seed, sizeof(seed)) != 1) {
                // Fall back to unrandomized context if RNG fails — still functional,
                // just without side-channel blinding.
                return;
            }
            (void) secp256k1_context_randomize(g_ctx, seed);
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
            const auto size = ab->size();
            if (size == 0) {
                return {};
            }
            auto *p = reinterpret_cast<const uint8_t *>(ab->data());
            // Borrowed ArrayBuffers can return nullptr from data() after JS GC
            // (NitroModules/ArrayBuffer.hpp). Constructing a vector from a null
            // pointer + non-zero size is UB; reject explicitly. Empty buffers
            // are handled above so we never perform pointer arithmetic on null.
            if (p == nullptr) {
                throw std::invalid_argument("ArrayBuffer has null data");
            }
            return std::vector<uint8_t>(p, p + size);
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

    // -----------------------------------------------------------------------
    // Per-chain address derivation from already-derived pubkeys
    //
    // Each of the four entry points below is a thin wrapper around the
    // existing helpers in address_derivation.hpp. They exist so callers that
    // already hold a per-chain compressed pubkey (e.g. via
    // wallet.getPublicKeyFor) can skip the BIP32/BIP44 derivation entirely
    // and pay only the address-encode cost. Synchronous — the work is one
    // hash + bech32/EIP-55 + (for EVM) one libsecp256k1 decompress per call.
    // -----------------------------------------------------------------------

    namespace {
        // Copy a JS-owned ArrayBuffer into a heap vector. The Nitro
        // ArrayBuffer pointer can race with JS GC across thread hops, but
        // these methods are synchronous on the JS thread so we copy once and
        // hand the bytes to the encoder helpers (which take vectors).
        inline std::vector<uint8_t> abToVec(
                const std::shared_ptr<ArrayBuffer> &buf, const char *what) {
            if (!buf || buf->data() == nullptr) {
                throw std::invalid_argument(
                    std::string(what) + ": publicKey is null");
            }
            return std::vector<uint8_t>(
                buf->data(), buf->data() + buf->size());
        }

        inline std::vector<uint8_t> requireCompressedSecp256k1(
                const std::shared_ptr<ArrayBuffer> &buf, const char *what) {
            auto v = abToVec(buf, what);
            if (v.size() != 33) {
                throw std::invalid_argument(
                    std::string(what) +
                    ": expected 33-byte compressed secp256k1 pubkey, got " +
                    std::to_string(v.size()) + " bytes");
            }
            // First byte must be 0x02 or 0x03 (compressed pubkey prefix).
            // libsecp256k1 will reject otherwise but we catch it early with
            // a clear message so callers see what went wrong.
            if (v[0] != 0x02 && v[0] != 0x03) {
                throw std::invalid_argument(
                    std::string(what) +
                    ": compressed pubkey must start with 0x02 or 0x03");
            }
            return v;
        }
    }

    std::vector<std::string> CryptoHybrid::deriveAddressesForEvm(
            const std::vector<std::shared_ptr<ArrayBuffer>> &publicKeys) {
        validatePubkeyBatchSize(publicKeys.size(), "deriveAddressesForEvm");
        auto *sctx = CryptoHybrid::ctx();
        std::vector<std::string> out;
        out.reserve(publicKeys.size());
        for (const auto &buf : publicKeys) {
            auto pk = requireCompressedSecp256k1(buf, "deriveAddressesForEvm");
            out.push_back(evm_address_from_pubkey(sctx, pk));
        }
        return out;
    }

    std::vector<std::string> CryptoHybrid::deriveAddressesForSvm(
            const std::vector<std::shared_ptr<ArrayBuffer>> &publicKeys) {
        validatePubkeyBatchSize(publicKeys.size(), "deriveAddressesForSvm");
        std::vector<std::string> out;
        out.reserve(publicKeys.size());
        for (const auto &buf : publicKeys) {
            auto pk = abToVec(buf, "deriveAddressesForSvm");
            if (pk.size() != 32) {
                throw std::invalid_argument(
                    "deriveAddressesForSvm: expected 32-byte Ed25519 pubkey, got " +
                    std::to_string(pk.size()) + " bytes");
            }
            out.push_back(base58_encode(pk));
        }
        return out;
    }

    std::vector<std::string> CryptoHybrid::deriveAddressesForBtc(
            const std::vector<std::shared_ptr<ArrayBuffer>> &publicKeys,
            bool isTestnet) {
        validatePubkeyBatchSize(publicKeys.size(), "deriveAddressesForBtc");
        std::vector<std::string> out;
        out.reserve(publicKeys.size());
        for (const auto &buf : publicKeys) {
            auto pk = requireCompressedSecp256k1(buf, "deriveAddressesForBtc");
            out.push_back(btc_address_from_pubkey(pk, isTestnet));
        }
        return out;
    }

    std::vector<DerivedAvalancheAddresses> CryptoHybrid::deriveAddressesForAvalanche(
            const std::vector<std::shared_ptr<ArrayBuffer>> &avalanchePublicKeys,
            const std::vector<std::shared_ptr<ArrayBuffer>> &evmPublicKeys,
            bool isTestnet) {
        if (avalanchePublicKeys.size() != evmPublicKeys.size()) {
            throw std::invalid_argument(
                "deriveAddressesForAvalanche: avalanchePublicKeys and "
                "evmPublicKeys must have the same length");
        }
        validatePubkeyBatchSize(
            avalanchePublicKeys.size(), "deriveAddressesForAvalanche");

        const std::string avax_hrp = isTestnet ? "fuji" : "avax";

        std::vector<DerivedAvalancheAddresses> out;
        out.reserve(avalanchePublicKeys.size());
        for (size_t i = 0; i < avalanchePublicKeys.size(); ++i) {
            auto avax_pk = requireCompressedSecp256k1(
                avalanchePublicKeys[i],
                "deriveAddressesForAvalanche (avalanchePublicKey)");
            auto evm_pk = requireCompressedSecp256k1(
                evmPublicKeys[i],
                "deriveAddressesForAvalanche (evmPublicKey)");

            // X-/P- share the same bech32 body (Hash160(avax pubkey)).
            auto avax_bech32 = avalanche_bech32_from_pubkey(avax_pk, avax_hrp);
            // CoreEth uses the EVM pubkey with the avax/fuji HRP — matches
            // derive_addresses_for_index in address_derivation.hpp.
            auto core_eth_bech32 = avalanche_bech32_from_pubkey(evm_pk, avax_hrp);

            out.emplace_back(
                "X-" + avax_bech32,
                "P-" + avax_bech32,
                "C-" + core_eth_bech32);
        }
        return out;
    }

} // namespace margelo::nitro::nitroavalabscrypto
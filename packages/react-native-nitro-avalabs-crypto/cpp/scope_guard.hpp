#pragma once

#include <array>
#include <cstdint>
#include <utility>

#include <openssl/crypto.h>

namespace margelo::nitro::nitroavalabscrypto::detail {

// RAII scope guard for secret-buffer cleansing and other
// run-on-scope-exit cleanup work.  The lambda runs on destruction —
// normal scope exit *or* exception unwind — ensuring that
// OPENSSL_cleanse / free / similar end-of-scope work happens on every
// control-flow path.
//
// Usage:
//   std::array<uint8_t, 32> sk{};
//   detail::ScopeGuard cleanseSk([&] { OPENSSL_cleanse(sk.data(), sk.size()); });
//
//   auto I = hmac_sha512(...);  // may throw — sk still cleansed
//
// For "cleanse only on failure" patterns, gate the lambda body on a
// flag flipped just before the successful return:
//
//   bool succeeded = false;
//   detail::ScopeGuard releaseOnFail([&] {
//     if (!succeeded) { OPENSSL_cleanse(buf.data(), buf.size()); }
//   });
//   // ... work that may throw ...
//   succeeded = true;
//   return buf;
template<typename F>
struct ScopeGuard {
    F fn;
    explicit ScopeGuard(F f) : fn(std::move(f)) {}

    // Destructor is noexcept AND swallows any exception thrown by `fn`.
    //
    // A bare `~ScopeGuard() { fn(); }` would let an exception from the
    // cleanup lambda escape during stack unwinding — if another exception
    // is already in flight, that's a double-fault and the runtime calls
    // std::terminate. These guards exist precisely to protect secret
    // material on exception paths, so a cleanup-time terminate is the
    // worst possible failure mode (it kills the process *and* leaves the
    // secret in memory).
    //
    // Belt-and-suspenders: the `noexcept` annotation makes the contract
    // explicit and lets the compiler optimize; the inner `try/catch(...)`
    // ensures we never actually throw, so the noexcept guarantee holds
    // even if `fn` is a future user-supplied lambda doing non-trivial
    // work, or an exotic OpenSSL build wraps OPENSSL_cleanse.
    ~ScopeGuard() noexcept {
        try {
            fn();
        } catch (...) {
            // Silently swallow — there is no safe way to surface an
            // error from a destructor running during unwind, and the
            // process must not terminate. Cleanup is best-effort.
        }
    }

    ScopeGuard(const ScopeGuard &) = delete;
    ScopeGuard &operator=(const ScopeGuard &) = delete;
};

// ---------------------------------------------------------------------------
// CleansingArray<N> — fixed-size byte buffer that OPENSSL_cleanses on
// destruction.
//
// Use this instead of std::array / std::vector when the buffer holds
// secret material whose cleansing must survive paths a manual
// ScopeGuard can't cover — most notably **values captured by move into
// a deferred async lambda whose execution is not guaranteed**:
//
//   CleansingArray<64> seedBytes;
//   // ... fill ...
//   Promise<T>::async([buf = std::move(seedBytes), ...]() mutable {
//       use(buf.data(), buf.size());
//       // No explicit cleanse needed — `buf` cleanses on lambda destruction
//       // whether the lambda runs to completion, throws, or never runs at
//       // all (e.g. process teardown / promise discarded before dispatch).
//   });
//
// Move semantics: the source is cleansed immediately after the move so
// only the live owner retains the secret bytes.  Copies are deleted —
// duplicating secret material is almost always a bug.
// ---------------------------------------------------------------------------

template<size_t N>
class CleansingArray {
public:
    CleansingArray() = default;

    ~CleansingArray() noexcept {
        OPENSSL_cleanse(buf_.data(), N);
    }

    CleansingArray(CleansingArray &&other) noexcept {
        buf_ = other.buf_;
        OPENSSL_cleanse(other.buf_.data(), N);
    }

    CleansingArray &operator=(CleansingArray &&other) noexcept {
        if (this != &other) {
            OPENSSL_cleanse(buf_.data(), N);
            buf_ = other.buf_;
            OPENSSL_cleanse(other.buf_.data(), N);
        }
        return *this;
    }

    CleansingArray(const CleansingArray &) = delete;
    CleansingArray &operator=(const CleansingArray &) = delete;

    uint8_t *data() noexcept { return buf_.data(); }
    const uint8_t *data() const noexcept { return buf_.data(); }
    constexpr size_t size() const noexcept { return N; }

private:
    std::array<uint8_t, N> buf_{};
};

} // namespace margelo::nitro::nitroavalabscrypto::detail

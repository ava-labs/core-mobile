#pragma once

#include <utility>

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

} // namespace margelo::nitro::nitroavalabscrypto::detail

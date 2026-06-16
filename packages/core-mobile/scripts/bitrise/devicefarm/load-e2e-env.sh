#!/usr/bin/env bash
# Shared helper: extract E2E env vars from .env.production.e2e (if the file exists).
# All regression scripts source this file. To add a new env var, edit only this file.
# Values are exported so child processes (test.js) can read them.

if [ -f "$CORE_MOBILE_DIR/.env.production.e2e" ]; then
  _env="$CORE_MOBILE_DIR/.env.production.e2e"

  # Mnemonic-based test credentials
  E2E_PK=$(grep '^E2E_PK=' "$_env" | cut -d'=' -f2-)
  E2E_MNEMONIC=$(grep '^E2E_MNEMONIC=' "$_env" | cut -d'=' -f2-)
  E2E_METAMASK_MNEMONIC=$(grep '^E2E_METAMASK_MNEMONIC=' "$_env" | cut -d'=' -f2-)

  # Seedless / custom OIDC credentials (from 1Password via colleague)
  TEST_OIDC_PRIVATE_KEY=$(grep '^TEST_OIDC_PRIVATE_KEY=' "$_env" | cut -d'=' -f2-)
  TEST_OIDC_ISSUER=$(grep '^TEST_OIDC_ISSUER=' "$_env" | cut -d'=' -f2-)
  TEST_OIDC_AUDIENCE=$(grep '^TEST_OIDC_AUDIENCE=' "$_env" | cut -d'=' -f2-)
  TEST_OIDC_SUB=$(grep '^TEST_OIDC_SUB=' "$_env" | cut -d'=' -f2-)
  TEST_OIDC_EMAIL=$(grep '^TEST_OIDC_EMAIL=' "$_env" | cut -d'=' -f2-)

  export E2E_PK E2E_MNEMONIC E2E_METAMASK_MNEMONIC
  export TEST_OIDC_PRIVATE_KEY TEST_OIDC_ISSUER TEST_OIDC_AUDIENCE TEST_OIDC_SUB TEST_OIDC_EMAIL
fi

#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully

set -o pipefail

# enable corepack
corepack enable

if ! cat /etc/issue 2>/dev/null
then
yarn install --immutable && yarn setup
else 
  stack=$( cat /etc/issue )
fi

if [[ $stack == *Ubuntu* ]]; then
    # on ubuntu, yarn setup command will fail
    # as patch-package doesn't have write access to the node_modules folder
    # thus, we need to set write permission manually and rerun yarn
    # Bitrise issue link https://support.bitrise.io/hc/en-us/requests/39436?page=1
    sudo chown root .

    yarn install --immutable && yarn setup
fi
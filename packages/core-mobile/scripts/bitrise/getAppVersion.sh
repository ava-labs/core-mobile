#!/usr/bin/env bash

# if branch is a release branch ("release/2.0.1" for example), grab version from branch name 
# else if tag is a release candidate tag ("0.13.1-rc1" for example), grab version from tag
if [[ $BITRISE_GIT_BRANCH == *release/* ]]; then
  arrIN=(${BITRISE_GIT_BRANCH//// })
  version=${arrIN[1]}
elif [[ $BITRISE_GIT_TAG =~ "rc" ]]; then
  arrIN=(${BITRISE_GIT_TAG//-/ })
  version=${arrIN[0]}
else
  # else version will just be 0.0.0
  version="0.0.0"
fi

envman add --key APP_VERSION --value "${version}"
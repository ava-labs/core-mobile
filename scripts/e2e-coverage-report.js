{
  "summary": {
    "e2eSource": "e2e-appium",
    "appiumSpecFiles": 39,
    "testIdsDeclaredTotal": 143,
    "testIdsReferencedInSpecTotal": 6,
    "testIdLiteralCoverageInSpecPercent": 4,
    "totalCoveragePercent": 92,
    "totalCoveragePercentBasis": "inScopeMappedFeatures_union_specPathOrTestIdInSpec",
    "regressionAdjustedCoveragePercentIos": 68,
    "regressionAdjustedCoveragePercentIosBasis": "inScopeMappedFeatures_heuristicO_and_noMappedIosRegressionFailure",
    "regressionStableFeatureCountIos": 17,
    "regressionFailedFeatureCountIos": 6,
    "regressionFailedFeatureNamesIos": [
      "accountSettings",
      "addEthereumChain",
      "defiMarket",
      "portfolio",
      "tokenManagement",
      "wallets"
    ],
    "regressionAdjustedCoveragePercentAndroid": 92,
    "regressionAdjustedCoveragePercentAndroidBasis": "inScopeMappedFeatures_heuristicO_and_noMappedAndroidRegressionFailure",
    "regressionStableFeatureCountAndroid": 23,
    "regressionFailedFeatureCountAndroid": 0,
    "regressionFailedFeatureNamesAndroid": [],
    "testrail": {
      "ios": {
        "enabled": true,
        "runId": 24126,
        "runName": "[REGRESSION] iOS Test Run: 2026-04-10",
        "mappedTestsInRun": 103,
        "mappedPassed": 91,
        "mappedFailed": 12,
        "mappedPassPercent": 88,
        "unmappedTestResults": 2,
        "unmappedFailedTestResults": 0,
        "failedSpecRelPaths": [
          "specs/portfolioTab/assets/ownedTokenDetail.spec.ts",
          "specs/settings/customNetwork.spec.ts",
          "specs/settings/importWallet.spec.ts",
          "specs/settings/networks.spec.ts",
          "specs/transactions/earn/borrow.spec.ts"
        ],
        "unmappedKeySamples": [
          "Browser - dApp\tShould verify the injected provider on dapps",
          "Browser - dApp\tShould swap on dapp"
        ]
      },
      "android": {
        "enabled": true,
        "runId": 22905,
        "runName": "[REGRESSION] Android Test Run: 2026-02-24",
        "mappedTestsInRun": 0,
        "mappedPassed": 0,
        "mappedFailed": 0,
        "mappedPassPercent": null,
        "unmappedTestResults": 7,
        "unmappedFailedTestResults": 1,
        "failedSpecRelPaths": [],
        "unmappedKeySamples": [
          "Browser tab\tshould show History empty state when no history",
          "Browser tab\tshould open Tabs panel",
          "Browser tab\tshould navigate to URL and show webview",
          "Browser tab\tshould close webview and return to Discover",
          "Browser tab\tshould show visited URL in History",
          "Browser tab\tshould close all tabs and return to Discover",
          "Browser tab\t[Smoke] should open Browser tab and show Discover"
        ]
      }
    },
    "featuresTotal": 31,
    "featuresWithMapping": 31,
    "featuresExcludedFromMetrics": [
      "appReview",
      "bridge",
      "keystone",
      "ledger",
      "nestEgg",
      "rpc"
    ],
    "featuresWithMappingInScope": 25,
    "featuresTouchedBySpecPath": 23,
    "featureSpecPathCoveragePercent": 92,
    "featuresWithDeclaredTestIdsReferencedInSpec": 2,
    "featureTestIdInSpecCoveragePercent": 8,
    "featuresTouchedBySpecOrTestIdInSpec": 23,
    "featureCombinedCoveragePercent": 92,
    "modalsTotal": 58,
    "modalsInScopeForMetrics": 46,
    "modalsTouchedByE2ePath": 9,
    "modalPathCoveragePercent": 20,
    "modalsTouchedByPathOrLinkedFeature": 46,
    "modalCoveragePercentPathOrLinkedFeature": 100
  },
  "features": [
    {
      "name": "accountSettings",
      "components": 26,
      "screens": 6,
      "tests": [
        "specs/settings/accounts.spec.ts",
        "specs/settings/appIcon.spec.ts",
        "specs/settings/changePin.spec.ts",
        "specs/settings/contacts.spec.ts",
        "specs/settings/coreAnalytics.spec.ts",
        "specs/settings/currency.spec.ts",
        "specs/settings/customNetwork.spec.ts",
        "specs/settings/importWallet.spec.ts",
        "specs/settings/networks.spec.ts",
        "specs/settings/notification.spec.ts",
        "specs/settings/showRecoveryPhrase.spec.ts",
        "specs/settings/testnet.spec.ts",
        "specs/settings/theme.spec.ts"
      ],
      "testIdFilesScanned": 26,
      "testIdsDeclared": 19,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": true,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "remove_account_disabled",
        "remove_account",
        "advanced_title__",
        "advanced_subtitle__",
        "contact_delete_btn__",
        "advanced_input__",
        "right_value__",
        "name_btn",
        "mnemonic_screen__copy_phrase_button",
        "currency__",
        "selected_currency__",
        "copy_btn__solana",
        "copy_btn__",
        "add_contact_btn",
        "save_network_btn",
        "custom_avatar",
        "network_name__",
        "add_network_btn",
        "network_list__"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "remove_account_disabled",
        "remove_account",
        "advanced_title__",
        "advanced_subtitle__",
        "contact_delete_btn__",
        "advanced_input__",
        "right_value__",
        "name_btn",
        "mnemonic_screen__copy_phrase_button",
        "currency__",
        "selected_currency__",
        "copy_btn__solana",
        "copy_btn__",
        "add_contact_btn",
        "save_network_btn",
        "custom_avatar",
        "network_name__",
        "add_network_btn",
        "network_list__"
      ]
    },
    {
      "name": "activity",
      "components": 4,
      "screens": 2,
      "tests": [],
      "testIdFilesScanned": 4,
      "testIdsDeclared": 2,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "X",
      "coveredBySpecPath": false,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": false,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "section_header",
        "network_dropdown_btn"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "section_header",
        "network_dropdown_btn"
      ]
    },
    {
      "name": "addEthereumChain",
      "components": 1,
      "screens": 1,
      "tests": [
        "specs/settings/customNetwork.spec.ts",
        "specs/settings/networks.spec.ts"
      ],
      "testIdFilesScanned": 1,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": true,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "appReview",
      "components": 0,
      "screens": 0,
      "tests": [],
      "testIdFilesScanned": 0,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": true,
      "coverageMark": "△",
      "coveredBySpecPath": false,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": false,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "approval",
      "components": 15,
      "screens": 1,
      "tests": [
        "specs/browser/dapp.spec.ts"
      ],
      "testIdFilesScanned": 15,
      "testIdsDeclared": 9,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "reject_button",
        "approve_button_disabled",
        "approve_button",
        "token_amount",
        "address__",
        "network__",
        "token_gas_fee",
        "gasless_on",
        "gasless_off"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "reject_button",
        "approve_button_disabled",
        "approve_button",
        "token_amount",
        "address__",
        "network__",
        "token_gas_fee",
        "gasless_on",
        "gasless_off"
      ]
    },
    {
      "name": "bridge",
      "components": 9,
      "screens": 5,
      "tests": [],
      "testIdFilesScanned": 9,
      "testIdsDeclared": 3,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": true,
      "coverageMark": "△",
      "coveredBySpecPath": false,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": false,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "pending_btn",
        "next_btn",
        "token_selector__"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "pending_btn",
        "next_btn",
        "token_selector__"
      ]
    },
    {
      "name": "browser",
      "components": 17,
      "screens": 0,
      "tests": [
        "specs/browser/dapp.spec.ts"
      ],
      "testIdFilesScanned": 17,
      "testIdsDeclared": 2,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "search_bar",
        "myWebview"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "search_bar",
        "myWebview"
      ]
    },
    {
      "name": "buy",
      "components": 1,
      "screens": 1,
      "tests": [
        "specs/transactions/buy.spec.ts"
      ],
      "testIdFilesScanned": 1,
      "testIdsDeclared": 3,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "coinbasePay_logo",
        "moonPay_logo",
        "halliday_logo"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "coinbasePay_logo",
        "moonPay_logo",
        "halliday_logo"
      ]
    },
    {
      "name": "collectibleSend",
      "components": 2,
      "screens": 2,
      "tests": [
        "specs/portfolioTab/collectibles/collectiblesDetail.spec.ts",
        "specs/portfolioTab/collectibles/collectiblesFilterSortView.spec.ts",
        "specs/portfolioTab/collectibles/manageCollectibles.spec.ts",
        "specs/transactions/cChain/sendNft.spec.ts",
        "specs/transactions/ethereum/sendEthNft.spec.ts"
      ],
      "testIdFilesScanned": 2,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "defi",
      "components": 0,
      "screens": 0,
      "tests": [
        "specs/portfolioTab/defi/defi.spec.ts"
      ],
      "testIdFilesScanned": 0,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "defiMarket",
      "components": 48,
      "screens": 16,
      "tests": [
        "specs/transactions/earn/borrow.spec.ts",
        "specs/transactions/earn/deposit.spec.ts"
      ],
      "testIdFilesScanned": 48,
      "testIdsDeclared": 11,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": true,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "borrow_card__",
        "repay_btn__",
        "network_logo__",
        "protocol_logo__",
        "deposit_card__",
        "withdraw_btn__",
        "next_btn",
        "next_btn_disabled",
        "borrow_detail_repay_btn",
        "borrow_asset__",
        "depositOrBuy__"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "borrow_card__",
        "repay_btn__",
        "network_logo__",
        "protocol_logo__",
        "deposit_card__",
        "withdraw_btn__",
        "next_btn",
        "next_btn_disabled",
        "borrow_detail_repay_btn",
        "borrow_asset__",
        "depositOrBuy__"
      ]
    },
    {
      "name": "editContact",
      "components": 1,
      "screens": 1,
      "tests": [
        "specs/settings/contacts.spec.ts"
      ],
      "testIdFilesScanned": 1,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "keystone",
      "components": 3,
      "screens": 2,
      "tests": [],
      "testIdFilesScanned": 3,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": true,
      "coverageMark": "△",
      "coveredBySpecPath": false,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": false,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "ledger",
      "components": 14,
      "screens": 7,
      "tests": [],
      "testIdFilesScanned": 14,
      "testIdsDeclared": 1,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": true,
      "coverageMark": "△",
      "coveredBySpecPath": false,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": false,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "connected_device_list"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "connected_device_list"
      ]
    },
    {
      "name": "meld",
      "components": 27,
      "screens": 16,
      "tests": [
        "specs/transactions/buy.spec.ts"
      ],
      "testIdFilesScanned": 27,
      "testIdsDeclared": 8,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "icon__",
        "error_msg",
        "next_btn_disabled",
        "next_btn",
        "select_country__",
        "selected_country__",
        "right_value__",
        "token_selector__"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "icon__",
        "error_msg",
        "next_btn_disabled",
        "next_btn",
        "select_country__",
        "selected_country__",
        "right_value__",
        "token_selector__"
      ]
    },
    {
      "name": "nestEgg",
      "components": 3,
      "screens": 2,
      "tests": [],
      "testIdFilesScanned": 3,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": true,
      "coverageMark": "△",
      "coveredBySpecPath": false,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": false,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "notifications",
      "components": 14,
      "screens": 2,
      "tests": [
        "specs/settings/notification.spec.ts"
      ],
      "testIdFilesScanned": 14,
      "testIdsDeclared": 1,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "swap-activity-"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "swap-activity-"
      ]
    },
    {
      "name": "onboarding",
      "components": 23,
      "screens": 0,
      "tests": [
        "specs/onboarding/metaMaskWallet.spec.ts",
        "specs/onboarding/newWallet.spec.ts"
      ],
      "testIdFilesScanned": 23,
      "testIdsDeclared": 20,
      "testIdsReferencedInSpec": 3,
      "testIdReferencePercent": 15,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": true,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "unlock_btn",
        "noThanks_btn",
        "anlaysticsContent",
        "lets_go_btn",
        "selected_avatar",
        "toggle_biometrics_on",
        "toggle_biometrics_off",
        "import_btn",
        "mnemonic_ava__words_view",
        "mnemonic__",
        "mnemonic_screen__copy_phrase_button",
        "next_btn",
        "text_area__recovery_phrase",
        "name_wallet_next_btn",
        "name_text_input",
        "agreeAndContinueBtnDisabled",
        "agreeAndContinueBtn",
        "firstWord",
        "secondWord",
        "thirdWord"
      ],
      "testIdsReferencedList": [
        "firstWord",
        "secondWord",
        "thirdWord"
      ],
      "testIdsUnreferencedList": [
        "unlock_btn",
        "noThanks_btn",
        "anlaysticsContent",
        "lets_go_btn",
        "selected_avatar",
        "toggle_biometrics_on",
        "toggle_biometrics_off",
        "import_btn",
        "mnemonic_ava__words_view",
        "mnemonic__",
        "mnemonic_screen__copy_phrase_button",
        "next_btn",
        "text_area__recovery_phrase",
        "name_wallet_next_btn",
        "name_text_input",
        "agreeAndContinueBtnDisabled",
        "agreeAndContinueBtn"
      ]
    },
    {
      "name": "portfolio",
      "components": 51,
      "screens": 8,
      "tests": [
        "specs/performance/balance.spec.ts",
        "specs/performance/portfolio.spec.ts",
        "specs/portfolioTab/assets/assetsFilterSortView.spec.ts",
        "specs/portfolioTab/assets/ownedTokenDetail.spec.ts",
        "specs/portfolioTab/collectibles/collectiblesDetail.spec.ts",
        "specs/portfolioTab/collectibles/collectiblesFilterSortView.spec.ts",
        "specs/portfolioTab/collectibles/manageCollectibles.spec.ts",
        "specs/portfolioTab/defi/defi.spec.ts"
      ],
      "testIdFilesScanned": 51,
      "testIdsDeclared": 35,
      "testIdsReferencedInSpec": 3,
      "testIdReferencePercent": 9,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": true,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": true,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "action_button__",
        "portfolio_token_list",
        "network_logo__p_chain",
        "network_logo__x_chain",
        "network_logo__",
        "tx__from_",
        "portfolio_token_item__",
        "grid_token_balance__",
        "grid_fiat_balance__",
        "list_token_balance__",
        "list_fiat_balance__",
        "refresh_btn",
        "set_as_my_avatar_btn",
        "collectible_hero",
        "nft_list_item__",
        "nft_by_network__",
        "nft_list_title__",
        "nft_grid_item__",
        "collectible_name__",
        "nft_mange_list_item__",
        "collectibles_handler",
        "unreachable_displayed",
        "unreachable_blocked",
        "portfolio",
        "defi_grid_item__",
        "defi_grid_title__",
        "defi_grid_price__",
        "defi_grid_browser_btn__",
        "defi_list_item__",
        "defi_list_title__",
        "defi_list_price__",
        "defi_list_browser_btn__",
        "defi_detail_browser_btn",
        "defi_detail_title",
        "defi_detail_price"
      ],
      "testIdsReferencedList": [
        "list_fiat_balance__",
        "nft_mange_list_item__",
        "portfolio"
      ],
      "testIdsUnreferencedList": [
        "action_button__",
        "portfolio_token_list",
        "network_logo__p_chain",
        "network_logo__x_chain",
        "network_logo__",
        "tx__from_",
        "portfolio_token_item__",
        "grid_token_balance__",
        "grid_fiat_balance__",
        "list_token_balance__",
        "refresh_btn",
        "set_as_my_avatar_btn",
        "collectible_hero",
        "nft_list_item__",
        "nft_by_network__",
        "nft_list_title__",
        "nft_grid_item__",
        "collectible_name__",
        "collectibles_handler",
        "unreachable_displayed",
        "unreachable_blocked",
        "defi_grid_item__",
        "defi_grid_title__",
        "defi_grid_price__",
        "defi_grid_browser_btn__",
        "defi_list_item__",
        "defi_list_title__",
        "defi_list_price__",
        "defi_list_browser_btn__",
        "defi_detail_browser_btn",
        "defi_detail_title",
        "defi_detail_price"
      ]
    },
    {
      "name": "privacyScreen",
      "components": 1,
      "screens": 1,
      "tests": [],
      "testIdFilesScanned": 1,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "X",
      "coveredBySpecPath": false,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": false,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "receive",
      "components": 6,
      "screens": 2,
      "tests": [
        "specs/transactions/receive.spec.ts"
      ],
      "testIdFilesScanned": 6,
      "testIdsDeclared": 6,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "copy_btn__",
        "receive_address__",
        "receive_token_qr_code",
        "select_receive_network",
        "evm_supported_address_text",
        "receive_network__"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "copy_btn__",
        "receive_address__",
        "receive_token_qr_code",
        "select_receive_network",
        "evm_supported_address_text",
        "receive_network__"
      ]
    },
    {
      "name": "rpc",
      "components": 3,
      "screens": 2,
      "tests": [
        "specs/browser/dapp.spec.ts"
      ],
      "testIdFilesScanned": 3,
      "testIdsDeclared": 1,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": true,
      "coverageMark": "△",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "account__"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "account__"
      ]
    },
    {
      "name": "send",
      "components": 12,
      "screens": 4,
      "tests": [
        "specs/transactions/cChain/send.spec.ts",
        "specs/transactions/cChain/sendNft.spec.ts",
        "specs/transactions/ethereum/sendEthNft.spec.ts",
        "specs/transactions/ethereum/sendEthereum.spec.ts",
        "specs/transactions/solana/sendSolana.spec.ts",
        "specs/transactions/withdraw.spec.ts",
        "specs/transactions/xpChain/sendXPChain.spec.ts"
      ],
      "testIdFilesScanned": 12,
      "testIdsDeclared": 5,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "search_bar",
        "send_select_token_list_btn",
        "next_btn",
        "next_btn_disabled",
        "token_selector__"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "search_bar",
        "send_select_token_list_btn",
        "next_btn",
        "next_btn_disabled",
        "token_selector__"
      ]
    },
    {
      "name": "stake",
      "components": 18,
      "screens": 10,
      "tests": [
        "specs/transactions/cChain/stakeTestnet.spec.ts"
      ],
      "testIdFilesScanned": 18,
      "testIdsDeclared": 3,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "insufficent_balance_error_msg",
        "claim_now_disabled",
        "claim_now"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "insufficent_balance_error_msg",
        "claim_now_disabled",
        "claim_now"
      ]
    },
    {
      "name": "swap",
      "components": 9,
      "screens": 6,
      "tests": [
        "specs/transactions/cChain/swap.spec.ts",
        "specs/transactions/solana/swapSolana.spec.ts"
      ],
      "testIdFilesScanned": 9,
      "testIdsDeclared": 8,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "network_selector__",
        "token_selector__",
        "icon__",
        "provider__",
        "selected_provider__",
        "error_msg",
        "next_btn_disabled",
        "next_btn"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "network_selector__",
        "token_selector__",
        "icon__",
        "provider__",
        "selected_provider__",
        "error_msg",
        "next_btn_disabled",
        "next_btn"
      ]
    },
    {
      "name": "toggleDeveloperMode",
      "components": 1,
      "screens": 1,
      "tests": [
        "specs/settings/testnet.spec.ts",
        "specs/transactions/cChain/stakeTestnet.spec.ts"
      ],
      "testIdFilesScanned": 1,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "tokenManagement",
      "components": 4,
      "screens": 4,
      "tests": [
        "specs/portfolioTab/assets/assetsFilterSortView.spec.ts",
        "specs/portfolioTab/assets/ownedTokenDetail.spec.ts"
      ],
      "testIdFilesScanned": 4,
      "testIdsDeclared": 1,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": true,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "add_custon_network_btn"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "add_custon_network_btn"
      ]
    },
    {
      "name": "track",
      "components": 23,
      "screens": 8,
      "tests": [
        "specs/transactions/cChain/swap.spec.ts"
      ],
      "testIdFilesScanned": 23,
      "testIdsDeclared": 8,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "line_graph",
        "token_detail_swap_btn",
        "market_token__",
        "account_address",
        "trending_token_crown__",
        "trending_token_name__",
        "trending_token_value__",
        "trending_token_symbol__"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "line_graph",
        "token_detail_swap_btn",
        "market_token__",
        "account_address",
        "trending_token_crown__",
        "trending_token_name__",
        "trending_token_value__",
        "trending_token_symbol__"
      ]
    },
    {
      "name": "transactionSuccessful",
      "components": 1,
      "screens": 1,
      "tests": [
        "specs/performance/transaction.spec.ts",
        "specs/transactions/cChain/send.spec.ts",
        "specs/transactions/cChain/sendNft.spec.ts",
        "specs/transactions/cChain/swap.spec.ts",
        "specs/transactions/ethereum/sendEthNft.spec.ts",
        "specs/transactions/ethereum/sendEthereum.spec.ts",
        "specs/transactions/solana/sendSolana.spec.ts",
        "specs/transactions/solana/swapSolana.spec.ts",
        "specs/transactions/xpChain/sendXPChain.spec.ts"
      ],
      "testIdFilesScanned": 1,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    },
    {
      "name": "wallets",
      "components": 4,
      "screens": 1,
      "tests": [
        "specs/settings/accounts.spec.ts",
        "specs/settings/importWallet.spec.ts"
      ],
      "testIdFilesScanned": 4,
      "testIdsDeclared": 2,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": 0,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": true,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [
        "account_detail_icon__",
        "add_wallet_btn"
      ],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": [
        "account_detail_icon__",
        "add_wallet_btn"
      ]
    },
    {
      "name": "watchAsset",
      "components": 1,
      "screens": 1,
      "tests": [
        "specs/transactions/cChain/swap.spec.ts"
      ],
      "testIdFilesScanned": 1,
      "testIdsDeclared": 0,
      "testIdsReferencedInSpec": 0,
      "testIdReferencePercent": null,
      "hasMapping": true,
      "excludedFromCoverageMetrics": false,
      "coverageMark": "O",
      "coveredBySpecPath": true,
      "coveredByTestIdInSpec": false,
      "coveredBySpecOrTestIdInSpec": true,
      "iosRegressionMappedFailure": false,
      "androidRegressionMappedFailure": false,
      "testIdsDeclaredList": [],
      "testIdsReferencedList": [],
      "testIdsUnreferencedList": []
    }
  ],
  "tests": [
    {
      "rel": "specs/browser/dapp.spec.ts",
      "features": [
        "approval",
        "browser",
        "rpc"
      ]
    },
    {
      "rel": "specs/onboarding/metaMaskWallet.spec.ts",
      "features": [
        "onboarding"
      ]
    },
    {
      "rel": "specs/onboarding/newWallet.spec.ts",
      "features": [
        "onboarding"
      ]
    },
    {
      "rel": "specs/performance/balance.spec.ts",
      "features": [
        "portfolio"
      ]
    },
    {
      "rel": "specs/performance/portfolio.spec.ts",
      "features": [
        "portfolio"
      ]
    },
    {
      "rel": "specs/performance/transaction.spec.ts",
      "features": [
        "transactionSuccessful"
      ]
    },
    {
      "rel": "specs/portfolioTab/assets/assetsFilterSortView.spec.ts",
      "features": [
        "portfolio",
        "tokenManagement"
      ]
    },
    {
      "rel": "specs/portfolioTab/assets/ownedTokenDetail.spec.ts",
      "features": [
        "portfolio",
        "tokenManagement"
      ]
    },
    {
      "rel": "specs/portfolioTab/collectibles/collectiblesDetail.spec.ts",
      "features": [
        "collectibleSend",
        "portfolio"
      ]
    },
    {
      "rel": "specs/portfolioTab/collectibles/collectiblesFilterSortView.spec.ts",
      "features": [
        "collectibleSend",
        "portfolio"
      ]
    },
    {
      "rel": "specs/portfolioTab/collectibles/manageCollectibles.spec.ts",
      "features": [
        "collectibleSend",
        "portfolio"
      ]
    },
    {
      "rel": "specs/portfolioTab/defi/defi.spec.ts",
      "features": [
        "defi",
        "portfolio"
      ]
    },
    {
      "rel": "specs/settings/accounts.spec.ts",
      "features": [
        "accountSettings",
        "wallets"
      ]
    },
    {
      "rel": "specs/settings/appIcon.spec.ts",
      "features": [
        "accountSettings"
      ]
    },
    {
      "rel": "specs/settings/changePin.spec.ts",
      "features": [
        "accountSettings"
      ]
    },
    {
      "rel": "specs/settings/contacts.spec.ts",
      "features": [
        "accountSettings",
        "editContact"
      ]
    },
    {
      "rel": "specs/settings/coreAnalytics.spec.ts",
      "features": [
        "accountSettings"
      ]
    },
    {
      "rel": "specs/settings/currency.spec.ts",
      "features": [
        "accountSettings"
      ]
    },
    {
      "rel": "specs/settings/customNetwork.spec.ts",
      "features": [
        "accountSettings",
        "addEthereumChain"
      ]
    },
    {
      "rel": "specs/settings/importWallet.spec.ts",
      "features": [
        "accountSettings",
        "wallets"
      ]
    },
    {
      "rel": "specs/settings/networks.spec.ts",
      "features": [
        "accountSettings",
        "addEthereumChain"
      ]
    },
    {
      "rel": "specs/settings/notification.spec.ts",
      "features": [
        "accountSettings",
        "notifications"
      ]
    },
    {
      "rel": "specs/settings/showRecoveryPhrase.spec.ts",
      "features": [
        "accountSettings"
      ]
    },
    {
      "rel": "specs/settings/testnet.spec.ts",
      "features": [
        "accountSettings",
        "toggleDeveloperMode"
      ]
    },
    {
      "rel": "specs/settings/theme.spec.ts",
      "features": [
        "accountSettings"
      ]
    },
    {
      "rel": "specs/transactions/buy.spec.ts",
      "features": [
        "buy",
        "meld"
      ]
    },
    {
      "rel": "specs/transactions/cChain/send.spec.ts",
      "features": [
        "send",
        "transactionSuccessful"
      ]
    },
    {
      "rel": "specs/transactions/cChain/sendNft.spec.ts",
      "features": [
        "collectibleSend",
        "send",
        "transactionSuccessful"
      ]
    },
    {
      "rel": "specs/transactions/cChain/stakeTestnet.spec.ts",
      "features": [
        "stake",
        "toggleDeveloperMode"
      ]
    },
    {
      "rel": "specs/transactions/cChain/swap.spec.ts",
      "features": [
        "swap",
        "track",
        "transactionSuccessful",
        "watchAsset"
      ]
    },
    {
      "rel": "specs/transactions/earn/borrow.spec.ts",
      "features": [
        "defiMarket"
      ]
    },
    {
      "rel": "specs/transactions/earn/deposit.spec.ts",
      "features": [
        "defiMarket"
      ]
    },
    {
      "rel": "specs/transactions/ethereum/sendEthNft.spec.ts",
      "features": [
        "collectibleSend",
        "send",
        "transactionSuccessful"
      ]
    },
    {
      "rel": "specs/transactions/ethereum/sendEthereum.spec.ts",
      "features": [
        "send",
        "transactionSuccessful"
      ]
    },
    {
      "rel": "specs/transactions/receive.spec.ts",
      "features": [
        "receive"
      ]
    },
    {
      "rel": "specs/transactions/solana/sendSolana.spec.ts",
      "features": [
        "send",
        "transactionSuccessful"
      ]
    },
    {
      "rel": "specs/transactions/solana/swapSolana.spec.ts",
      "features": [
        "swap",
        "transactionSuccessful"
      ]
    },
    {
      "rel": "specs/transactions/withdraw.spec.ts",
      "features": [
        "send"
      ]
    },
    {
      "rel": "specs/transactions/xpChain/sendXPChain.spec.ts",
      "features": [
        "send",
        "transactionSuccessful"
      ]
    }
  ],
  "modals": [
    {
      "modal": "accountSettings",
      "linkedFeature": "accountSettings",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "addAccountAppConnection",
      "linkedFeature": "ledger",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "addEthereumChain",
      "linkedFeature": "addEthereumChain",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "addStake",
      "linkedFeature": "stake",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "appUpdate",
      "linkedFeature": "onboarding",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": true,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "approval",
      "linkedFeature": "approval",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "authorizeDapp",
      "linkedFeature": "rpc",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "borrow",
      "linkedFeature": "defiMarket",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/transactions/earn/borrow.spec.ts"
      ],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "borrowDetail",
      "linkedFeature": "defiMarket",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "borrowRepay",
      "linkedFeature": "defiMarket",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "bridge",
      "linkedFeature": "bridge",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "bridgeStatus",
      "linkedFeature": "bridge",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "buy",
      "linkedFeature": "buy",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/transactions/buy.spec.ts"
      ],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "claimStakeReward",
      "linkedFeature": "stake",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "collectibleDetail",
      "linkedFeature": "collectibleSend",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "collectibleManagement",
      "linkedFeature": "collectibleSend",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "collectibleSend",
      "linkedFeature": "collectibleSend",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "defiDetail",
      "linkedFeature": "defi",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "deposit",
      "linkedFeature": "defiMarket",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/transactions/earn/deposit.spec.ts"
      ],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "depositDetail",
      "linkedFeature": "defiMarket",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "discoverCollectibles",
      "linkedFeature": "collectibleSend",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "editContact",
      "linkedFeature": "editContact",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "keystoneSigner",
      "linkedFeature": "keystone",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "keystoneTroubleshooting",
      "linkedFeature": "keystone",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "meld",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "meldOfframpCountry",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "meldOfframpCurrency",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "meldOfframpPaymentMethod",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "meldOfframpTokenList",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "meldOnrampCountry",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "meldOnrampCurrency",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "meldOnrampPaymentMethod",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "meldOnrampTokenList",
      "linkedFeature": "meld",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "nestEggCampaign",
      "linkedFeature": "nestEgg",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "notifications",
      "linkedFeature": "notifications",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/settings/notification.spec.ts"
      ],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "receive",
      "linkedFeature": "receive",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/transactions/receive.spec.ts"
      ],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "selectBridgeSourceNetwork",
      "linkedFeature": "bridge",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "selectBridgeTargetNetwork",
      "linkedFeature": "bridge",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "selectBridgeToken",
      "linkedFeature": "bridge",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "selectCustomTokenNetwork",
      "linkedFeature": "tokenManagement",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "selectReceiveNetwork",
      "linkedFeature": "receive",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "selectSendToken",
      "linkedFeature": "send",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "selectSwapFromToken",
      "linkedFeature": "swap",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "selectSwapToToken",
      "linkedFeature": "swap",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "send",
      "linkedFeature": "send",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/transactions/cChain/send.spec.ts",
        "specs/transactions/cChain/sendNft.spec.ts",
        "specs/transactions/ethereum/sendEthNft.spec.ts",
        "specs/transactions/ethereum/sendEthereum.spec.ts",
        "specs/transactions/solana/sendSolana.spec.ts",
        "specs/transactions/xpChain/sendXPChain.spec.ts"
      ],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "solanaConnection",
      "linkedFeature": "ledger",
      "coveredByPath": false,
      "coveredByLinkedFeature": false,
      "coveredByLinkedSpec": false,
      "coveredByLinkedTestIds": false,
      "covered": false,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "solanaLaunch",
      "linkedFeature": "send",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "stakeDetail",
      "linkedFeature": "stake",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "swap",
      "linkedFeature": "swap",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/transactions/cChain/swap.spec.ts",
        "specs/transactions/solana/swapSolana.spec.ts"
      ],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "toggleDeveloperMode",
      "linkedFeature": "toggleDeveloperMode",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "tokenDetail",
      "linkedFeature": "tokenManagement",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/portfolioTab/assets/ownedTokenDetail.spec.ts"
      ],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "tokenManagement",
      "linkedFeature": "tokenManagement",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "trackTokenDetail",
      "linkedFeature": "track",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "transactionSuccessful",
      "linkedFeature": "transactionSuccessful",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "walletConnectScan",
      "linkedFeature": "rpc",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": false
    },
    {
      "modal": "wallets",
      "linkedFeature": "wallets",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "watchAsset",
      "linkedFeature": "watchAsset",
      "coveredByPath": false,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [],
      "inCoverageMetricsScope": true
    },
    {
      "modal": "withdraw",
      "linkedFeature": "send",
      "coveredByPath": true,
      "coveredByLinkedFeature": true,
      "coveredByLinkedSpec": true,
      "coveredByLinkedTestIds": false,
      "covered": true,
      "pathTests": [
        "specs/transactions/withdraw.spec.ts"
      ],
      "inCoverageMetricsScope": true
    }
  ]
}

import { AssetType, Blockchain, BridgeConfig } from '@avalabs/bridge-sdk'

const testnetDynamicFeesConfig: BridgeConfig = {
  config: {
    critical: {
      addressBlocklist: [
        '0xF759607ffee4B5482492927E51D3b7820DE4189d',
        'tb1qcdw48jq3ne3qkw73ya37lvq7gquxnsnq0sd6uc'
      ],
      assets: {
        USDT: {
          assetType: AssetType.ERC20,
          symbol: 'USDT',
          avaxPromotionAmount: '100000000000000000',
          avaxPromotionDollarThreshold: 1,
          chainlinkFeedAddress: '0xb4c4a493ab6356497713a78ffa6c60fb53517c63',
          chainlinkFeedNetwork: 'ethereum',
          denomination: 6,
          ipfsHash:
            '0000000000000000000000000000000000000000000000000000000000000000',
          nativeContractAddress: '0x34035079e420e9d8e7accc27910c2aef9f5912dc',
          nativeNetwork: Blockchain.ETHEREUM,
          offboardFeeConfiguration: {
            feePercentage: 1,
            feePercentageDecimals: 3,
            maximumFeeDollars: 1000,
            minimumFeeDollars: 12
          },
          offboardFeeProcessThreshold: '600000000',
          onboardFeeConfiguration: {
            feePercentage: 25,
            feePercentageDecimals: 5,
            maximumFeeDollars: 250,
            minimumFeeDollars: 3
          },
          tokenName: 'Tether USD',
          transferGasLimit: 70000,
          wrappedContractAddress: '0x70f697632af91f1667021510df3874e9781adc58',
          wrappedNetwork: 'avalanche'
        },
        WBTC: {
          assetType: AssetType.ERC20,
          symbol: 'WBTC',
          avaxPromotionAmount: '100000000000000000',
          avaxPromotionDollarThreshold: 1,
          chainlinkFeedAddress: '0xb4c4a493ab6356497713a78ffa6c60fb53517c63',
          chainlinkFeedNetwork: 'ethereum',
          denomination: 8,
          ipfsHash:
            '0000000000000000000000000000000000000000000000000000000000000000',
          nativeContractAddress: '0x5462e267b0a69a7ce6eff062543bc799afa6ab21',
          nativeNetwork: Blockchain.ETHEREUM,
          offboardFeeConfiguration: {
            feePercentage: 1,
            feePercentageDecimals: 3,
            maximumFeeDollars: 1000,
            minimumFeeDollars: 12
          },
          offboardFeeProcessThreshold: '1200000',
          onboardFeeConfiguration: {
            feePercentage: 25,
            feePercentageDecimals: 5,
            maximumFeeDollars: 250,
            minimumFeeDollars: 3
          },
          tokenName: 'Wrapped BTC',
          transferGasLimit: 55000,
          wrappedContractAddress: '0x0b24273dc7230bcd842e60add18ccd434b38376b',
          wrappedNetwork: 'avalanche'
        },
        WETH: {
          assetType: AssetType.ERC20,
          symbol: 'WETH',
          avaxPromotionAmount: '100000000000000000',
          avaxPromotionDollarThreshold: 1,
          chainlinkFeedAddress: '0x0000000000000000000000000000000000000000',
          chainlinkFeedNetwork: 'ethereum',
          denomination: 18,
          ipfsHash:
            '0000000000000000000000000000000000000000000000000000000000000000',
          nativeContractAddress: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
          nativeNetwork: Blockchain.ETHEREUM,
          offboardFeeConfiguration: {
            feePercentage: 1,
            feePercentageDecimals: 3,
            maximumFeeDollars: 1000,
            minimumFeeDollars: 12
          },
          offboardFeeProcessThreshold: '1000000000000000000',
          onboardFeeConfiguration: {
            feePercentage: 25,
            feePercentageDecimals: 5,
            maximumFeeDollars: 250,
            minimumFeeDollars: 3
          },
          tokenName: 'Wrapped Ether',
          transferGasLimit: 70000,
          wrappedContractAddress: '0x05106a7e9709622653139ebe9caed28a5c071775',
          wrappedNetwork: 'avalanche'
        }
      },
      disableFrontend: false,
      networks: {
        avalanche: 43113,
        ethereum: 5
      },
      operationMode: 'normal',
      operatorAddress: '0xF759607ffee4B5482492927E51D3b7820DE4189d',
      operatorEvmAddress: '0xF759607ffee4B5482492927E51D3b7820DE4189d',
      targetSecretVersion: 8,
      useEip1559TransactionFormat: true,
      useNewFeeStructure: true,
      walletAddresses: {
        avalanche: '0x51db8b5f608c04a19420b685717e8a45720187af',
        ethereum: '0x02e903e87360d484a0d422f52eebae5c77ac131c'
      }
    },
    nonCritical: {
      minimumConfirmations: {
        avalanche: 1,
        ethereum: 96
      },
      wrapFeeApproximation: {
        USDT: {
          minimumFeeAmount: '923077',
          maximumFeeAmount: '76923077',
          feePercentage: 25,
          feePercentageDecimals: 5
        },
        WBTC: {
          minimumFeeAmount: '923077',
          maximumFeeAmount: '76923077',
          feePercentage: 25,
          feePercentageDecimals: 5
        },
        WETH: {
          minimumFeeAmount: '1500000000000000', // approx. $3
          maximumFeeAmount: '1500000000000000000', // approx. $3000
          feePercentage: 25,
          feePercentageDecimals: 2
        }
      },
      unwrapFeeApproximation: {
        USDT: {
          minimumFeeAmount: '5692309',
          maximumFeeAmount: '309692309',
          feePercentage: 1,
          feePercentageDecimals: 3
        },
        WBTC: {
          minimumFeeAmount: '5692309',
          maximumFeeAmount: '309692309',
          feePercentage: 1,
          feePercentageDecimals: 3
        },
        WETH: {
          // more expensive than bringing assets to avalanche
          minimumFeeAmount: '6000000000000000', // approx. $12
          maximumFeeAmount: '3000000000000000000', // approx. $6000
          feePercentage: 1,
          feePercentageDecimals: 1
        }
      },
      useChainlinkAssetPriceFeeds: true,
      chainlinkAvaxUsdFeedAddress: '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
      chainlinkEthUsdFeedAddress: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
      chainlinkBtcUsdFeedAddress: '0xA39434A63A52E749F02807ae27335515BA4b07F7',
      currentEthPrice: '201817000000',
      currentAvaxPrice: '1887615300',
      currentGasPrices: {
        avalanche: {
          nextBaseFee: '28125000000',
          suggestedTip: '2000000000'
        },
        ethereum: {
          nextBaseFee: '21919547441',
          suggestedTip: '7043641657'
        }
      },
      updated: '2023-04-13 20:16:44.236394753 +0000 UTC m=+33375.482294111',
      startupTime: '2023-04-13 11:00:28.766049456 +0000 UTC m=+0.011948808'
    },
    criticalBitcoin: {
      addressBlocklist: [
        '0xF759607ffee4B5482492927E51D3b7820DE4189d',
        'tb1qcdw48jq3ne3qkw73ya37lvq7gquxnsnq0sd6uc'
      ],
      avalancheChainId: 43113,
      bitcoinAssets: {
        btc: {
          assetType: AssetType.BTC,
          symbol: 'BTC',
          denomination: 8,
          nativeNetwork: Blockchain.BITCOIN,
          additionalTxFeeAmount: 0,
          avaxPromotionAmount: '100000000000000000',
          avaxPromotionDollarThreshold: 50,
          bech32AddressPrefix: 'tb',
          offboardFeeConfiguration: {
            feePercentage: 1,
            feePercentageDecimals: 3,
            maximumFeeDollars: 1000,
            minimumFeeDollars: 12
          },
          onboardFeeConfiguration: {
            feePercentage: 25,
            feePercentageDecimals: 5,
            maximumFeeDollars: 250,
            minimumFeeDollars: 3
          },
          operatorAddress: 'tb1qcsq9k2qxf4sr5zewxvn79g7wpc08xrtecsr3zc',
          privateKeyPrefix: 'EF',
          reserveBalanceHighWaterMark: 200000000,
          reserveBalanceLowWaterMark: 100000000,
          targetChangeAmount: 5000000,
          tokenName: 'Bitcoin',
          wrappedContractAddress: '0x1cd0fcbe15e4365c8d11513e0406ca00f02e61c8',
          wrappedNetwork: 'avalanche'
        }
      },
      disableFrontend: false,
      operationMode: 'normal',
      operatorAddress: '0xF759607ffee4B5482492927E51D3b7820DE4189d',
      operatorEvmAddress: '0xF759607ffee4B5482492927E51D3b7820DE4189d',
      targetSecretVersion: 2,
      useEip1559TransactionFormat: true,
      useNewFeeStructure: true,
      walletAddresses: {
        avalanche: '0x1acc0bc039f4e594bbc65160726813c0223fb2bf',
        btc: 'tb1q7zjeqmrq9pq4u2v3ett9rfhd9r3nprh0cpr2lc'
      }
    },
    nonCriticalBitcoin: {
      networkInfo: {
        btc: {
          minimumConfirmations: 4,
          minimumOnboardSize: 2000,
          currentPrice: '3025542000000',
          currentFeeRate: {
            feeRate: 10,
            source: 'smartFeeEstimate'
          },
          currentUtxoStatistics: {
            tb1q7zjeqmrq9pq4u2v3ett9rfhd9r3nprh0cpr2lc: {
              mean: '3055220',
              count: '1'
            }
          },
          currentBridgeFeeEstimate: {
            dustThreshold: 1000,
            wrapFeeEstimate: {
              minimumFeeAmount: '10000', // approx. $3
              maximumFeeAmount: '10000000', // approx. $3000
              feePercentage: 25,
              feePercentageDecimals: 2
            },
            unwrapFeeEstimate: {
              bridgeToll: {
                minimumFeeAmount: '40000', // approx. $12
                maximumFeeAmount: '20000000', // approx. $6000
                feePercentage: 1,
                feePercentageDecimals: 1
              },
              estimatedTxFee: {
                constAmount: 4000,
                numeratorPerSat: 680,
                denominatorPerSat: 1360000
              }
            }
          },
          reserveBalance: 38460,
          networkView: {
            lastIndexedBlock: 2428773,
            lastSeenBlock: 2428776,
            nodeVersion: '/Satoshi:24.0.1/'
          }
        }
      },
      updated: '2023-04-13 20:16:44.238268891 +0000 UTC m=+33375.484168242'
    },
    startupTime: '2023-04-13 11:00:28.766049456 +0000 UTC m=+0.011948808',
    version: 'v0.0.0'
  }
}

export default testnetDynamicFeesConfig

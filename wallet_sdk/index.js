'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var avalanche$1 = require('avalanche');
var dist = require('avalanche/dist');
var Web3 = require('web3');
var utils$2 = require('avalanche/dist/utils');
var axios = require('axios');
var avm = require('avalanche/dist/apis/avm');
var common = require('avalanche/dist/common');
var platformvm = require('avalanche/dist/apis/platformvm');
var evm = require('avalanche/dist/apis/evm');
var tx = require('@ethereumjs/tx');
var EthereumjsCommon = require('@ethereumjs/common');
var Big = require('big.js');
var createHash = require('create-hash');
var moment = require('moment');
var bip39 = require('bip39');
var HDKey = require('hdkey');
var ethereumjsUtil = require('ethereumjs-util');
var ethers = require('ethers');
var keychain = require('avalanche/dist/apis/avm/keychain');
require('bignumber.js');
var rlp = require('rlp');
var keychain$1 = require('avalanche/dist/apis/evm/keychain');
var _ = require('buffer/');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            }
        });
    }
    n['default'] = e;
    return Object.freeze(n);
}

var Web3__default = /*#__PURE__*/_interopDefaultLegacy(Web3);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var EthereumjsCommon__default = /*#__PURE__*/_interopDefaultLegacy(EthereumjsCommon);
var Big__default = /*#__PURE__*/_interopDefaultLegacy(Big);
var createHash__default = /*#__PURE__*/_interopDefaultLegacy(createHash);
var moment__default = /*#__PURE__*/_interopDefaultLegacy(moment);
var bip39__namespace = /*#__PURE__*/_interopNamespace(bip39);
var HDKey__default = /*#__PURE__*/_interopDefaultLegacy(HDKey);
var rlp__default = /*#__PURE__*/_interopDefaultLegacy(rlp);

function wsUrlFromConfigX(config) {
    var protocol = config.apiProtocol === 'http' ? 'ws' : 'wss';
    return protocol + "://" + config.apiIp + ":" + config.apiPort + "/ext/bc/X/events";
}
function wsUrlFromConfigEVM(config) {
    var protocol = config.apiProtocol === 'http' ? 'ws' : 'wss';
    return protocol + "://" + config.apiIp + ":" + config.apiPort + "/ext/bc/C/ws";
}
function rpcUrlFromConfig(conf) {
    return conf.apiProtocol + "://" + conf.apiIp + ":" + conf.apiPort + "/ext/bc/C/rpc";
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __spreadArray(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
}

// import { AVMConstants } from 'avalanche/dist/apis/avm';
var MainnetConfig = {
    apiProtocol: 'https',
    apiIp: 'api.avax.network',
    apiPort: 443,
    explorerURL: 'https://explorerapi.avax.network',
    explorerSiteURL: 'https://explorer.avax.network',
    networkID: 1,
    // @ts-ignore
    xChainID: utils$2.Defaults.network[1]['X']['blockchainID'],
    // @ts-ignore
    pChainID: utils$2.Defaults.network[1]['P']['blockchainID'],
    // @ts-ignore
    cChainID: utils$2.Defaults.network[1]['C']['blockchainID'],
    // @ts-ignore
    evmChainID: utils$2.Defaults.network[1]['C']['chainID'],
    // @ts-ignore
    avaxID: utils$2.Defaults.network[1]['X']['avaxAssetID'],
};
var TestnetConfig = {
    apiProtocol: 'https',
    apiIp: 'api.avax-test.network',
    apiPort: 443,
    explorerURL: 'https://explorerapi.avax-test.network',
    explorerSiteURL: 'https://explorer.avax-test.network',
    networkID: 5,
    // @ts-ignore
    xChainID: utils$2.Defaults.network[5]['X']['blockchainID'],
    // @ts-ignore
    pChainID: utils$2.Defaults.network[5]['P']['blockchainID'],
    // @ts-ignore
    cChainID: utils$2.Defaults.network[5]['C']['blockchainID'],
    // @ts-ignore
    evmChainID: utils$2.Defaults.network[5]['C']['chainID'],
    // @ts-ignore
    avaxID: utils$2.Defaults.network[5]['X']['avaxAssetID'],
};
var LocalnetConfig = {
    apiProtocol: 'http',
    apiIp: 'localhost',
    apiPort: 9650,
    networkID: 12345,
    // @ts-ignore
    xChainID: utils$2.Defaults.network[12345]['X']['blockchainID'],
    // @ts-ignore
    pChainID: utils$2.Defaults.network[12345]['P']['blockchainID'],
    // @ts-ignore
    cChainID: utils$2.Defaults.network[12345]['C']['blockchainID'],
    // @ts-ignore
    evmChainID: utils$2.Defaults.network[12345]['C']['chainID'],
    // @ts-ignore
    avaxID: utils$2.Defaults.network[12345]['X']['avaxAssetID'],
};
// Default network connection
var DefaultConfig = MainnetConfig;

var constants = /*#__PURE__*/Object.freeze({
    __proto__: null,
    MainnetConfig: MainnetConfig,
    TestnetConfig: TestnetConfig,
    LocalnetConfig: LocalnetConfig,
    DefaultConfig: DefaultConfig
});

var avalanche = new dist.Avalanche(DefaultConfig.apiIp, DefaultConfig.apiPort, DefaultConfig.apiProtocol, DefaultConfig.networkID);
var xChain = avalanche.XChain();
var cChain = avalanche.CChain();
var pChain = avalanche.PChain();
avalanche.Info();
// export const bintools: BinTools = BinTools.getInstance();
var rpcUrl = rpcUrlFromConfig(DefaultConfig);
var web3 = new Web3__default['default'](rpcUrl);
var explorer_api = null;
var activeNetwork$1 = DefaultConfig;
function createExplorerApi(networkConfig) {
    if (!networkConfig.explorerURL) {
        throw new Error('Network configuration does not specify an explorer API.');
    }
    return axios__default['default'].create({
        baseURL: networkConfig.explorerURL,
        withCredentials: false,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
function setRpcNetwork(conf) {
    avalanche.setAddress(conf.apiIp, conf.apiPort, conf.apiProtocol);
    avalanche.setNetworkID(conf.networkID);
    xChain.refreshBlockchainID(conf.xChainID);
    xChain.setBlockchainAlias('X');
    pChain.refreshBlockchainID(conf.pChainID);
    pChain.setBlockchainAlias('P');
    cChain.refreshBlockchainID(conf.cChainID);
    cChain.setBlockchainAlias('C');
    xChain.setAVAXAssetID(conf.avaxID);
    pChain.setAVAXAssetID(conf.avaxID);
    cChain.setAVAXAssetID(conf.avaxID);
    if (conf.explorerURL) {
        explorer_api = createExplorerApi(conf);
    }
    else {
        explorer_api = null;
    }
    var rpcUrl = rpcUrlFromConfig(conf);
    web3.setProvider(rpcUrl);
    activeNetwork$1 = conf;
}

var _format = "hh-sol-artifact-1";
var contractName = "ERC20";
var sourceName = "contracts/token/ERC20/ERC20.sol";
var abi = [
	{
		inputs: [
			{
				internalType: "string",
				name: "name_",
				type: "string"
			},
			{
				internalType: "string",
				name: "symbol_",
				type: "string"
			}
		],
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "spender",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "value",
				type: "uint256"
			}
		],
		name: "Approval",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "from",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "value",
				type: "uint256"
			}
		],
		name: "Transfer",
		type: "event"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				internalType: "address",
				name: "spender",
				type: "address"
			}
		],
		name: "allowance",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "spender",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "approve",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address"
			}
		],
		name: "balanceOf",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "decimals",
		outputs: [
			{
				internalType: "uint8",
				name: "",
				type: "uint8"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "spender",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "subtractedValue",
				type: "uint256"
			}
		],
		name: "decreaseAllowance",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "spender",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "addedValue",
				type: "uint256"
			}
		],
		name: "increaseAllowance",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "name",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "symbol",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "totalSupply",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "recipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "transfer",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "sender",
				type: "address"
			},
			{
				internalType: "address",
				name: "recipient",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "transferFrom",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	}
];
var bytecode = "0x60806040523480156200001157600080fd5b5060405162000b7938038062000b798339810160408190526200003491620001c1565b81516200004990600390602085019062000068565b5080516200005f90600490602084019062000068565b5050506200027b565b828054620000769062000228565b90600052602060002090601f0160209004810192826200009a5760008555620000e5565b82601f10620000b557805160ff1916838001178555620000e5565b82800160010185558215620000e5579182015b82811115620000e5578251825591602001919060010190620000c8565b50620000f3929150620000f7565b5090565b5b80821115620000f35760008155600101620000f8565b600082601f8301126200011f578081fd5b81516001600160401b03808211156200013c576200013c62000265565b604051601f8301601f19908116603f0116810190828211818310171562000167576200016762000265565b8160405283815260209250868385880101111562000183578485fd5b8491505b83821015620001a6578582018301518183018401529082019062000187565b83821115620001b757848385830101525b9695505050505050565b60008060408385031215620001d4578182fd5b82516001600160401b0380821115620001eb578384fd5b620001f9868387016200010e565b935060208501519150808211156200020f578283fd5b506200021e858286016200010e565b9150509250929050565b600181811c908216806200023d57607f821691505b602082108114156200025f57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052604160045260246000fd5b6108ee806200028b6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012357806370a082311461013657806395d89b4114610149578063a457c2d714610151578063a9059cbb14610164578063dd62ed3e14610177576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101b0565b6040516100c391906107e5565b60405180910390f35b6100df6100da3660046107bc565b610242565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610781565b610258565b604051601281526020016100c3565b6100df6101313660046107bc565b61030e565b6100f361014436600461072e565b610345565b6100b6610364565b6100df61015f3660046107bc565b610373565b6100df6101723660046107bc565b61040e565b6100f361018536600461074f565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101bf90610867565b80601f01602080910402602001604051908101604052809291908181526020018280546101eb90610867565b80156102385780601f1061020d57610100808354040283529160200191610238565b820191906000526020600020905b81548152906001019060200180831161021b57829003601f168201915b5050505050905090565b600061024f33848461041b565b50600192915050565b600061026584848461053f565b6001600160a01b0384166000908152600160209081526040808320338452909152902054828110156102ef5760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e74206578636565647320616044820152676c6c6f77616e636560c01b60648201526084015b60405180910390fd5b61030385336102fe8685610850565b61041b565b506001949350505050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909161024f9185906102fe908690610838565b6001600160a01b0381166000908152602081905260409020545b919050565b6060600480546101bf90610867565b3360009081526001602090815260408083206001600160a01b0386168452909152812054828110156103f55760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084016102e6565b61040433856102fe8685610850565b5060019392505050565b600061024f33848461053f565b6001600160a01b03831661047d5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084016102e6565b6001600160a01b0382166104de5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016102e6565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b0383166105a35760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016102e6565b6001600160a01b0382166106055760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b60648201526084016102e6565b6001600160a01b0383166000908152602081905260409020548181101561067d5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b60648201526084016102e6565b6106878282610850565b6001600160a01b0380861660009081526020819052604080822093909355908516815290812080548492906106bd908490610838565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161070991815260200190565b60405180910390a350505050565b80356001600160a01b038116811461035f57600080fd5b60006020828403121561073f578081fd5b61074882610717565b9392505050565b60008060408385031215610761578081fd5b61076a83610717565b915061077860208401610717565b90509250929050565b600080600060608486031215610795578081fd5b61079e84610717565b92506107ac60208501610717565b9150604084013590509250925092565b600080604083850312156107ce578182fd5b6107d783610717565b946020939093013593505050565b6000602080835283518082850152825b81811015610811578581018301518582016040015282016107f5565b818111156108225783604083870101525b50601f01601f1916929092016040019392505050565b6000821982111561084b5761084b6108a2565b500190565b600082821015610862576108626108a2565b500390565b600181811c9082168061087b57607f821691505b6020821081141561089c57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fdfea2646970667358221220f532269c0b2ab7e801b67a95294344969d1b8ad08c1b2492d01cf2d1d05444cb64736f6c63430008030033";
var deployedBytecode = "0x608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012357806370a082311461013657806395d89b4114610149578063a457c2d714610151578063a9059cbb14610164578063dd62ed3e14610177576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101b0565b6040516100c391906107e5565b60405180910390f35b6100df6100da3660046107bc565b610242565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610781565b610258565b604051601281526020016100c3565b6100df6101313660046107bc565b61030e565b6100f361014436600461072e565b610345565b6100b6610364565b6100df61015f3660046107bc565b610373565b6100df6101723660046107bc565b61040e565b6100f361018536600461074f565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101bf90610867565b80601f01602080910402602001604051908101604052809291908181526020018280546101eb90610867565b80156102385780601f1061020d57610100808354040283529160200191610238565b820191906000526020600020905b81548152906001019060200180831161021b57829003601f168201915b5050505050905090565b600061024f33848461041b565b50600192915050565b600061026584848461053f565b6001600160a01b0384166000908152600160209081526040808320338452909152902054828110156102ef5760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e74206578636565647320616044820152676c6c6f77616e636560c01b60648201526084015b60405180910390fd5b61030385336102fe8685610850565b61041b565b506001949350505050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909161024f9185906102fe908690610838565b6001600160a01b0381166000908152602081905260409020545b919050565b6060600480546101bf90610867565b3360009081526001602090815260408083206001600160a01b0386168452909152812054828110156103f55760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084016102e6565b61040433856102fe8685610850565b5060019392505050565b600061024f33848461053f565b6001600160a01b03831661047d5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084016102e6565b6001600160a01b0382166104de5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016102e6565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b0383166105a35760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016102e6565b6001600160a01b0382166106055760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b60648201526084016102e6565b6001600160a01b0383166000908152602081905260409020548181101561067d5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b60648201526084016102e6565b6106878282610850565b6001600160a01b0380861660009081526020819052604080822093909355908516815290812080548492906106bd908490610838565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8460405161070991815260200190565b60405180910390a350505050565b80356001600160a01b038116811461035f57600080fd5b60006020828403121561073f578081fd5b61074882610717565b9392505050565b60008060408385031215610761578081fd5b61076a83610717565b915061077860208401610717565b90509250929050565b600080600060608486031215610795578081fd5b61079e84610717565b92506107ac60208501610717565b9150604084013590509250925092565b600080604083850312156107ce578182fd5b6107d783610717565b946020939093013593505050565b6000602080835283518082850152825b81811015610811578581018301518582016040015282016107f5565b818111156108225783604083870101525b50601f01601f1916929092016040019392505050565b6000821982111561084b5761084b6108a2565b500190565b600082821015610862576108626108a2565b500390565b600181811c9082168061087b57607f821691505b6020821081141561089c57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fdfea2646970667358221220f532269c0b2ab7e801b67a95294344969d1b8ad08c1b2492d01cf2d1d05444cb64736f6c63430008030033";
var linkReferences = {
};
var deployedLinkReferences = {
};
var ERC20Abi = {
	_format: _format,
	contractName: contractName,
	sourceName: sourceName,
	abi: abi,
	bytecode: bytecode,
	deployedBytecode: deployedBytecode,
	linkReferences: linkReferences,
	deployedLinkReferences: deployedLinkReferences
};

var bintools$1 = avalanche$1.BinTools.getInstance();

// export async function buildUnsignedTransaction(
//     orders: (ITransaction | AVMUTXO)[],
//     addr: string,
//     derivedAddresses: string[],
//     utxoset: AVMUTXOSet,
//     changeAddress?: string,
//     memo?: Buffer
// ) {
//     // TODO: Get new change index.
//     if (!changeAddress) {
//         throw new Error('Unable to issue transaction. Ran out of change index.');
//     }
//
//     let fromAddrsStr: string[] = derivedAddresses;
//     let fromAddrs: Buffer[] = fromAddrsStr.map((val) => bintools.parseAddress(val, 'X'));
//     let changeAddr: Buffer = bintools.stringToAddress(changeAddress);
//
//     // TODO: use internal asset ID
//     // This does not update on network change, causing issues
//     const AVAX_ID_BUF = await xChain.getAVAXAssetID();
//     const AVAX_ID_STR = AVAX_ID_BUF.toString('hex');
//     const TO_BUF = bintools.stringToAddress(addr);
//
//     const aad: AssetAmountDestination = new AssetAmountDestination([TO_BUF], fromAddrs, [changeAddr]);
//     const ZERO = new BN(0);
//     let isFeeAdded = false;
//
//     // Aggregate Fungible ins & outs
//     for (let i: number = 0; i < orders.length; i++) {
//         let order: ITransaction | AVMUTXO = orders[i];
//
//         if ((order as ITransaction).asset) {
//             // if fungible
//             let tx: ITransaction = order as ITransaction;
//
//             let assetId = bintools.cb58Decode(tx.asset.id);
//             let amt: BN = tx.amount;
//
//             if (assetId.toString('hex') === AVAX_ID_STR) {
//                 aad.addAssetAmount(assetId, amt, xChain.getTxFee());
//                 isFeeAdded = true;
//             } else {
//                 aad.addAssetAmount(assetId, amt, ZERO);
//             }
//         }
//     }
//
//     // If fee isn't added, add it
//     if (!isFeeAdded) {
//         if (xChain.getTxFee().gt(ZERO)) {
//             aad.addAssetAmount(AVAX_ID_BUF, ZERO, xChain.getTxFee());
//         }
//     }
//
//     const success: Error = utxoset.getMinimumSpendable(aad);
//
//     let ins: TransferableInput[] = [];
//     let outs: TransferableOutput[] = [];
//     if (typeof success === 'undefined') {
//         ins = aad.getInputs();
//         outs = aad.getAllOutputs();
//     } else {
//         throw success;
//     }
//
//     //@ts-ignore
//     let nftUtxos: UTXO[] = orders.filter((val) => {
//         if ((val as ITransaction).asset) return false;
//         return true;
//     });
//
//     // If transferring an NFT, build the transaction on top of an NFT tx
//     let unsignedTx: AVMUnsignedTx;
//     let networkId: number = avalanche.getNetworkID();
//     let chainId: Buffer = bintools.cb58Decode(xChain.getBlockchainID());
//
//     if (nftUtxos.length > 0) {
//         let nftSet = new AVMUTXOSet();
//         nftSet.addArray(nftUtxos);
//
//         let utxoIds: string[] = nftSet.getUTXOIDs();
//
//         // Sort nft utxos
//         utxoIds.sort((a, b) => {
//             if (a < b) {
//                 return -1;
//             } else if (a > b) {
//                 return 1;
//             }
//             return 0;
//         });
//
//         unsignedTx = nftSet.buildNFTTransferTx(
//             networkId,
//             chainId,
//             [TO_BUF],
//             fromAddrs,
//             fromAddrs, // change address should be something else?
//             utxoIds,
//             undefined,
//             undefined,
//             memo
//         );
//
//         let rawTx = unsignedTx.getTransaction();
//         let outsNft = rawTx.getOuts();
//         let insNft = rawTx.getIns();
//
//         // TODO: This is a hackish way of doing this, need methods in avalanche.js
//         //@ts-ignore
//         rawTx.outs = outsNft.concat(outs);
//         //@ts-ignore
//         rawTx.ins = insNft.concat(ins);
//     } else {
//         let baseTx: BaseTx = new BaseTx(networkId, chainId, outs, ins, memo);
//         unsignedTx = new AVMUnsignedTx(baseTx);
//     }
//     return unsignedTx;
// }
function buildCreateNftFamilyTx(name, symbol, groupNum, fromAddrs, minterAddr, changeAddr, utxoSet) {
    return __awaiter(this, void 0, void 0, function () {
        var fromAddresses, changeAddress, minterAddress, minterSets, i, minterSet, unsignedTx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fromAddresses = fromAddrs;
                    changeAddress = changeAddr;
                    minterAddress = minterAddr;
                    minterSets = [];
                    // Create the groups
                    for (i = 0; i < groupNum; i++) {
                        minterSet = new avm.MinterSet(1, [minterAddress]);
                        minterSets.push(minterSet);
                    }
                    return [4 /*yield*/, xChain.buildCreateNFTAssetTx(utxoSet, fromAddresses, [changeAddress], minterSets, name, symbol)];
                case 1:
                    unsignedTx = _a.sent();
                    return [2 /*return*/, unsignedTx];
            }
        });
    });
}
function buildMintNftTx(mintUtxo, payload, quantity, ownerAddress, changeAddress, fromAddresses, utxoSet) {
    return __awaiter(this, void 0, void 0, function () {
        var addrBuf, owners, sourceAddresses, i, owner, groupID, mintTx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    addrBuf = bintools$1.parseAddress(ownerAddress, 'X');
                    owners = [];
                    sourceAddresses = fromAddresses;
                    for (i = 0; i < quantity; i++) {
                        owner = new common.OutputOwners([addrBuf]);
                        owners.push(owner);
                    }
                    groupID = mintUtxo.getOutput().getGroupID();
                    return [4 /*yield*/, xChain.buildCreateNFTMintTx(utxoSet, owners, sourceAddresses, [changeAddress], mintUtxo.getUTXOID(), groupID, payload)];
                case 1:
                    mintTx = _a.sent();
                    return [2 /*return*/, mintTx];
            }
        });
    });
}
function buildAvmExportTransaction(destinationChain, utxoSet, fromAddresses, toAddress, amount, // export amount + fee
sourceChangeAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var destinationChainId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    switch (destinationChain) {
                        case 'P':
                            destinationChainId = pChain.getBlockchainID();
                            break;
                        case 'C':
                            destinationChainId = cChain.getBlockchainID();
                            break;
                    }
                    return [4 /*yield*/, xChain.buildExportTx(utxoSet, amount, destinationChainId, [toAddress], fromAddresses, [
                            sourceChangeAddress,
                        ])];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function buildEvmExportTransaction(fromAddresses, toAddress, amount, // export amount + fee
fromAddressBech) {
    return __awaiter(this, void 0, void 0, function () {
        var destinationChainId, nonce, avaxAssetIDBuf, avaxAssetIDStr, fromAddressHex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    destinationChainId = xChain.getBlockchainID();
                    return [4 /*yield*/, web3.eth.getTransactionCount(fromAddresses[0])];
                case 1:
                    nonce = _a.sent();
                    return [4 /*yield*/, xChain.getAVAXAssetID()];
                case 2:
                    avaxAssetIDBuf = _a.sent();
                    avaxAssetIDStr = bintools$1.cb58Encode(avaxAssetIDBuf);
                    fromAddressHex = fromAddresses[0];
                    return [4 /*yield*/, cChain.buildExportTx(amount, avaxAssetIDStr, destinationChainId, fromAddressHex, fromAddressBech, [toAddress], nonce)];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function buildEvmTransferNativeTx(from, to, amount, // in wei
gasPrice, gasLimit) {
    return __awaiter(this, void 0, void 0, function () {
        var nonce, chainId, networkId, chainParams, tx$1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3.eth.getTransactionCount(from)];
                case 1:
                    nonce = _a.sent();
                    return [4 /*yield*/, web3.eth.getChainId()];
                case 2:
                    chainId = _a.sent();
                    return [4 /*yield*/, web3.eth.net.getId()];
                case 3:
                    networkId = _a.sent();
                    chainParams = {
                        common: EthereumjsCommon__default['default'].forCustomChain('mainnet', { networkId: networkId, chainId: chainId }, 'istanbul'),
                    };
                    tx$1 = tx.Transaction.fromTxData({
                        nonce: nonce,
                        gasPrice: '0x' + gasPrice.toString('hex'),
                        gasLimit: gasLimit,
                        to: to,
                        value: '0x' + amount.toString('hex'),
                        data: '0x',
                    }, chainParams);
                    return [2 /*return*/, tx$1];
            }
        });
    });
}
function buildEvmTransferErc20Tx(from, to, amount, // in wei
gasPrice, gasLimit, contractAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var nonce, chainId, networkId, chainParams, cont, tokenTx, tx$1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3.eth.getTransactionCount(from)];
                case 1:
                    nonce = _a.sent();
                    return [4 /*yield*/, web3.eth.getChainId()];
                case 2:
                    chainId = _a.sent();
                    return [4 /*yield*/, web3.eth.net.getId()];
                case 3:
                    networkId = _a.sent();
                    chainParams = {
                        common: EthereumjsCommon__default['default'].forCustomChain('mainnet', { networkId: networkId, chainId: chainId }, 'istanbul'),
                    };
                    cont = new web3.eth.Contract(ERC20Abi.abi, contractAddress);
                    tokenTx = cont.methods.transfer(to, amount.toString());
                    tx$1 = tx.Transaction.fromTxData({
                        nonce: nonce,
                        gasPrice: '0x' + gasPrice.toString('hex'),
                        gasLimit: gasLimit,
                        value: '0x0',
                        to: contractAddress,
                        data: tokenTx.encodeABI(),
                    }, chainParams);
                    return [2 /*return*/, tx$1];
            }
        });
    });
}
var AvmTxNameEnum;
(function (AvmTxNameEnum) {
    AvmTxNameEnum[AvmTxNameEnum["Transaction"] = avm.AVMConstants.BASETX] = "Transaction";
    AvmTxNameEnum[AvmTxNameEnum["Mint"] = avm.AVMConstants.CREATEASSETTX] = "Mint";
    AvmTxNameEnum[AvmTxNameEnum["Operation"] = avm.AVMConstants.OPERATIONTX] = "Operation";
    AvmTxNameEnum[AvmTxNameEnum["Import"] = avm.AVMConstants.IMPORTTX] = "Import";
    AvmTxNameEnum[AvmTxNameEnum["Export"] = avm.AVMConstants.EXPORTTX] = "Export";
})(AvmTxNameEnum || (AvmTxNameEnum = {}));
var PlatfromTxNameEnum;
(function (PlatfromTxNameEnum) {
    PlatfromTxNameEnum[PlatfromTxNameEnum["Transaction"] = platformvm.PlatformVMConstants.BASETX] = "Transaction";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Add Validator"] = platformvm.PlatformVMConstants.ADDVALIDATORTX] = "Add Validator";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Add Delegator"] = platformvm.PlatformVMConstants.ADDDELEGATORTX] = "Add Delegator";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Import"] = platformvm.PlatformVMConstants.IMPORTTX] = "Import";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Export"] = platformvm.PlatformVMConstants.EXPORTTX] = "Export";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Add Subnet Validator"] = platformvm.PlatformVMConstants.ADDSUBNETVALIDATORTX] = "Add Subnet Validator";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Create Chain"] = platformvm.PlatformVMConstants.CREATECHAINTX] = "Create Chain";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Create Subnet"] = platformvm.PlatformVMConstants.CREATESUBNETTX] = "Create Subnet";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Advance Time"] = platformvm.PlatformVMConstants.ADVANCETIMETX] = "Advance Time";
    PlatfromTxNameEnum[PlatfromTxNameEnum["Reward Validator"] = platformvm.PlatformVMConstants.REWARDVALIDATORTX] = "Reward Validator";
})(PlatfromTxNameEnum || (PlatfromTxNameEnum = {}));
// TODO: create asset transactions
var ParseableAvmTxEnum;
(function (ParseableAvmTxEnum) {
    ParseableAvmTxEnum[ParseableAvmTxEnum["Transaction"] = avm.AVMConstants.BASETX] = "Transaction";
    ParseableAvmTxEnum[ParseableAvmTxEnum["Import"] = avm.AVMConstants.IMPORTTX] = "Import";
    ParseableAvmTxEnum[ParseableAvmTxEnum["Export"] = avm.AVMConstants.EXPORTTX] = "Export";
})(ParseableAvmTxEnum || (ParseableAvmTxEnum = {}));
var ParseablePlatformEnum;
(function (ParseablePlatformEnum) {
    ParseablePlatformEnum[ParseablePlatformEnum["Transaction"] = platformvm.PlatformVMConstants.BASETX] = "Transaction";
    ParseablePlatformEnum[ParseablePlatformEnum["Add Validator"] = platformvm.PlatformVMConstants.ADDVALIDATORTX] = "Add Validator";
    ParseablePlatformEnum[ParseablePlatformEnum["Add Delegator"] = platformvm.PlatformVMConstants.ADDDELEGATORTX] = "Add Delegator";
    ParseablePlatformEnum[ParseablePlatformEnum["Import"] = platformvm.PlatformVMConstants.IMPORTTX] = "Import";
    ParseablePlatformEnum[ParseablePlatformEnum["Export"] = platformvm.PlatformVMConstants.EXPORTTX] = "Export";
})(ParseablePlatformEnum || (ParseablePlatformEnum = {}));
var ParseableEvmTxEnum;
(function (ParseableEvmTxEnum) {
    ParseableEvmTxEnum[ParseableEvmTxEnum["Import"] = evm.EVMConstants.IMPORTTX] = "Import";
    ParseableEvmTxEnum[ParseableEvmTxEnum["Export"] = evm.EVMConstants.EXPORTTX] = "Export";
})(ParseableEvmTxEnum || (ParseableEvmTxEnum = {}));

/**
 *
 * @param addrs an array of X chain addresses to get the atomic utxos of
 * @param chainID Which chain to check agains, either `P` or `C`
 */
function avmGetAtomicUTXOs(addrs, chainID) {
    return __awaiter(this, void 0, void 0, function () {
        var selection, remaining, utxoSet, nextSet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    selection = addrs.slice(0, 1024);
                    remaining = addrs.slice(1024);
                    if (!(chainID === 'P')) return [3 /*break*/, 2];
                    return [4 /*yield*/, xChain.getUTXOs(selection, pChain.getBlockchainID())];
                case 1:
                    utxoSet = (_a.sent()).utxos;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, xChain.getUTXOs(selection, cChain.getBlockchainID())];
                case 3:
                    utxoSet = (_a.sent()).utxos;
                    _a.label = 4;
                case 4:
                    if (!(remaining.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, avmGetAtomicUTXOs(remaining, chainID)];
                case 5:
                    nextSet = _a.sent();
                    utxoSet = utxoSet.merge(nextSet);
                    _a.label = 6;
                case 6: return [2 /*return*/, utxoSet];
            }
        });
    });
}
// todo: Use end index to get ALL utxos
function platformGetAtomicUTXOs(addrs) {
    return __awaiter(this, void 0, void 0, function () {
        var selection, remaining, utxoSet, nextSet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    selection = addrs.slice(0, 1024);
                    remaining = addrs.slice(1024);
                    return [4 /*yield*/, pChain.getUTXOs(selection, xChain.getBlockchainID())];
                case 1:
                    utxoSet = (_a.sent()).utxos;
                    if (!(remaining.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, platformGetAtomicUTXOs(remaining)];
                case 2:
                    nextSet = _a.sent();
                    // @ts-ignore
                    utxoSet = utxoSet.merge(nextSet);
                    _a.label = 3;
                case 3: return [2 /*return*/, utxoSet];
            }
        });
    });
}
function getStakeForAddresses(addrs) {
    return __awaiter(this, void 0, void 0, function () {
        var chunk, remainingChunk, chunkStake, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(addrs.length <= 256)) return [3 /*break*/, 2];
                    return [4 /*yield*/, pChain.getStake(addrs)];
                case 1: return [2 /*return*/, _c.sent()];
                case 2:
                    chunk = addrs.slice(0, 256);
                    remainingChunk = addrs.slice(256);
                    return [4 /*yield*/, pChain.getStake(chunk)];
                case 3:
                    chunkStake = _c.sent();
                    _b = (_a = chunkStake).add;
                    return [4 /*yield*/, getStakeForAddresses(remainingChunk)];
                case 4: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
            }
        });
    });
}
function avmGetAllUTXOs(addrs) {
    return __awaiter(this, void 0, void 0, function () {
        var utxos, chunk, remainingChunk, newSet, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(addrs.length <= 1024)) return [3 /*break*/, 2];
                    return [4 /*yield*/, avmGetAllUTXOsForAddresses(addrs)];
                case 1:
                    utxos = _c.sent();
                    return [2 /*return*/, utxos];
                case 2:
                    chunk = addrs.slice(0, 1024);
                    remainingChunk = addrs.slice(1024);
                    return [4 /*yield*/, avmGetAllUTXOsForAddresses(chunk)];
                case 3:
                    newSet = _c.sent();
                    _b = (_a = newSet).merge;
                    return [4 /*yield*/, avmGetAllUTXOs(remainingChunk)];
                case 4: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
            }
        });
    });
}
function avmGetAllUTXOsForAddresses(addrs, endIndex) {
    return __awaiter(this, void 0, void 0, function () {
        var response, utxoSet, nextEndIndex, len, subUtxos;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (addrs.length > 1024)
                        throw new Error('Maximum length of addresses is 1024');
                    if (!!endIndex) return [3 /*break*/, 2];
                    return [4 /*yield*/, xChain.getUTXOs(addrs)];
                case 1:
                    response = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, xChain.getUTXOs(addrs, undefined, 0, endIndex)];
                case 3:
                    response = _a.sent();
                    _a.label = 4;
                case 4:
                    utxoSet = response.utxos;
                    utxoSet.getAllUTXOs();
                    nextEndIndex = response.endIndex;
                    len = response.numFetched;
                    if (!(len >= 1024)) return [3 /*break*/, 6];
                    return [4 /*yield*/, avmGetAllUTXOsForAddresses(addrs, nextEndIndex)];
                case 5:
                    subUtxos = _a.sent();
                    return [2 /*return*/, utxoSet.merge(subUtxos)];
                case 6: return [2 /*return*/, utxoSet];
            }
        });
    });
}
// helper method to get utxos for more than 1024 addresses
function platformGetAllUTXOs(addrs) {
    return __awaiter(this, void 0, void 0, function () {
        var newSet, chunk, remainingChunk, newSet, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(addrs.length <= 1024)) return [3 /*break*/, 2];
                    return [4 /*yield*/, platformGetAllUTXOsForAddresses(addrs)];
                case 1:
                    newSet = _c.sent();
                    return [2 /*return*/, newSet];
                case 2:
                    chunk = addrs.slice(0, 1024);
                    remainingChunk = addrs.slice(1024);
                    return [4 /*yield*/, platformGetAllUTXOsForAddresses(chunk)];
                case 3:
                    newSet = _c.sent();
                    _b = (_a = newSet).merge;
                    return [4 /*yield*/, platformGetAllUTXOs(remainingChunk)];
                case 4: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
            }
        });
    });
}
function platformGetAllUTXOsForAddresses(addrs, endIndex) {
    return __awaiter(this, void 0, void 0, function () {
        var response, utxoSet, nextEndIndex, len, subUtxos;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!endIndex) return [3 /*break*/, 2];
                    return [4 /*yield*/, pChain.getUTXOs(addrs)];
                case 1:
                    response = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, pChain.getUTXOs(addrs, undefined, 0, endIndex)];
                case 3:
                    response = _a.sent();
                    _a.label = 4;
                case 4:
                    utxoSet = response.utxos;
                    nextEndIndex = response.endIndex;
                    len = response.numFetched;
                    if (!(len >= 1024)) return [3 /*break*/, 6];
                    return [4 /*yield*/, platformGetAllUTXOsForAddresses(addrs, nextEndIndex)];
                case 5:
                    subUtxos = _a.sent();
                    return [2 /*return*/, utxoSet.merge(subUtxos)];
                case 6: return [2 /*return*/, utxoSet];
            }
        });
    });
}

var assetCache = {};
function getAssetDescription(assetId) {
    return __awaiter(this, void 0, void 0, function () {
        var cache, res, clean;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cache = assetCache[assetId];
                    if (cache) {
                        return [2 /*return*/, cache];
                    }
                    return [4 /*yield*/, xChain.getAssetDescription(assetId)];
                case 1:
                    res = _a.sent();
                    clean = __assign(__assign({}, res), { assetID: assetId });
                    assetCache[assetId] = clean;
                    return [2 /*return*/, clean];
            }
        });
    });
}

var Assets = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getAssetDescription: getAssetDescription
});

var NO_NETWORK = new Error('No network selected.');
var NO_EXPLORER_API = new Error('Explorer API not found.');

var Erc20Token = /** @class */ (function () {
    function Erc20Token(data) {
        this.name = data.name;
        this.symbol = data.symbol;
        this.address = data.address;
        this.decimals = data.decimals;
        this.chainId = data.chainId;
        //@ts-ignore
        this.contract = new web3.eth.Contract(ERC20Abi.abi, data.address);
    }
    Erc20Token.getData = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, name, symbol, decimals, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contract = new web3.eth.Contract(ERC20Abi.abi, address);
                        return [4 /*yield*/, contract.methods.name().call()];
                    case 1:
                        name = _b.sent();
                        return [4 /*yield*/, contract.methods.symbol().call()];
                    case 2:
                        symbol = _b.sent();
                        _a = parseInt;
                        return [4 /*yield*/, contract.methods.decimals().call()];
                    case 3:
                        decimals = _a.apply(void 0, [_b.sent()]);
                        if (!activeNetwork$1) {
                            throw NO_NETWORK;
                        }
                        return [2 /*return*/, {
                                name: name,
                                symbol: symbol,
                                decimals: decimals,
                                address: address,
                                chainId: activeNetwork$1.evmChainID,
                            }];
                }
            });
        });
    };
    Erc20Token.prototype.balanceOf = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var bal;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.balanceOf(address).call()];
                    case 1:
                        bal = _a.sent();
                        return [2 /*return*/, new avalanche$1.BN(bal)];
                }
            });
        });
    };
    return Erc20Token;
}());

var bintools = avalanche$1.BinTools.getInstance();
var validateAddress = function (address) {
    try {
        bintools.stringToAddress(address);
        return true;
    }
    catch (error) {
        return error.message;
    }
};

/**
 * @param val the amount to parse
 * @param denomination number of decimal places to parse with
 */
function bnToBig(val, denomination) {
    if (denomination === void 0) { denomination = 0; }
    return new Big__default['default'](val.toString()).div(Math.pow(10, denomination));
}
function bnToBigAvaxX(val) {
    return bnToBig(val, 9);
}
function bnToBigAvaxP(val) {
    return bnToBigAvaxX(val);
}
function bnToBigAvaxC(val) {
    return bnToBig(val, 18);
}
/**
 * Parses the value using a denomination of 18
 *
 * @param val the amount to parse given in WEI
 *
 * @example
 * ```
 * bnToAvaxC(new BN('22500000000000000000')
 * // will return  22.5
 *```
 *
 */
function bnToAvaxC(val) {
    return bnToLocaleString(val, 18);
}
/**
 * Parses the value using a denomination of 9
 *
 * @param val the amount to parse given in nAVAX
 */
function bnToAvaxX(val) {
    return bnToLocaleString(val, 9);
}
/**
 * Parses the value using a denomination of 9
 *
 * @param val the amount to parse given in nAVAX
 */
function bnToAvaxP(val) {
    return bnToAvaxX(val);
}
/**
 *
 * @param val the number to parse
 * @param decimals number of decimal places used to parse the number
 */
function numberToBN(val, decimals) {
    var valBig = Big__default['default'](val);
    var tens = Big__default['default'](10).pow(decimals);
    var valBN = new avalanche$1.BN(valBig.times(tens).toString());
    return valBN;
}
/**
 * @Remarks
 * A helper method to convert BN numbers to human readable strings.
 *
 * @param val The amount to convert
 * @param decimals Number of decimal places to parse the amount with
 *
 * @example
 * ```
 * bnToLocaleString(new BN(100095),2)
 * // will return '1,000.95'
 * ```
 */
function bnToLocaleString(val, decimals) {
    if (decimals === void 0) { decimals = 9; }
    var bigVal = bnToBig(val, decimals);
    var fixedStr = bigVal.toFixed(decimals);
    var split = fixedStr.split('.');
    var wholeStr = parseInt(split[0]).toLocaleString('en-US');
    if (split.length === 1) {
        return wholeStr;
    }
    else {
        var remainderStr = split[1];
        // remove trailing 0s
        var lastChar = remainderStr.charAt(remainderStr.length - 1);
        while (lastChar === '0') {
            remainderStr = remainderStr.substring(0, remainderStr.length - 1);
            lastChar = remainderStr.charAt(remainderStr.length - 1);
        }
        var trimmed = remainderStr.substring(0, decimals);
        if (!trimmed)
            return wholeStr;
        return wholeStr + "." + trimmed;
    }
}
var COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd';
/**
 * Fetches the current AVAX price using Coin Gecko.
 * @remarks
 * You might get rate limited if you use this function frequently.
 *
 * @return
 * Current USD price of 1 AVAX
 */
function getAvaxPrice() {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios__default['default'].get(COINGECKO_URL)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.data['avalanche-2'].usd];
            }
        });
    });
}
/**
 * Checks if address is valid.
 *
 * @return
 * boolean if address is valid, error message if not valid.
 */
function isValidAddress(address) {
    return validateAddress(address);
}
function digestMessage(msgStr) {
    var mBuf = Buffer.from(msgStr, 'utf8');
    var msgSize = Buffer.alloc(4);
    msgSize.writeUInt32BE(mBuf.length, 0);
    var msgBuf = Buffer.from("\u001AAvalanche Signed Message:\n" + msgSize + msgStr, 'utf8');
    return createHash__default['default']('sha256').update(msgBuf).digest();
}
function waitTxX(txId, tryCount) {
    if (tryCount === void 0) { tryCount = 10; }
    return __awaiter(this, void 0, void 0, function () {
        var resp, status, reason;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (tryCount <= 0) {
                        throw new Error('Timeout');
                    }
                    return [4 /*yield*/, xChain.getTxStatus(txId)];
                case 1:
                    resp = (_a.sent());
                    if (typeof resp === 'string') {
                        status = resp;
                    }
                    else {
                        status = resp.status;
                        reason = resp.reason;
                    }
                    if (!(status === 'Unknown' || status === 'Processing')) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = resolve;
                                            return [4 /*yield*/, waitTxX(txId, tryCount - 1)];
                                        case 1:
                                            _a.apply(void 0, [_b.sent()]);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, 1000);
                        })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    if (status === 'Rejected') {
                        throw new Error(reason);
                    }
                    else if (status === 'Accepted') {
                        return [2 /*return*/, txId];
                    }
                    _a.label = 4;
                case 4: return [2 /*return*/, txId];
            }
        });
    });
}
function waitTxP(txId, tryCount) {
    if (tryCount === void 0) { tryCount = 10; }
    return __awaiter(this, void 0, void 0, function () {
        var resp, status, reason;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (tryCount <= 0) {
                        throw new Error('Timeout');
                    }
                    return [4 /*yield*/, pChain.getTxStatus(txId)];
                case 1:
                    resp = (_a.sent());
                    if (typeof resp === 'string') {
                        status = resp;
                    }
                    else {
                        status = resp.status;
                        reason = resp.reason;
                    }
                    if (!(status === 'Unknown' || status === 'Processing')) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = resolve;
                                            return [4 /*yield*/, waitTxP(txId, tryCount - 1)];
                                        case 1:
                                            _a.apply(void 0, [_b.sent()]);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, 1000);
                        })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    if (status === 'Dropped') {
                        throw new Error(reason);
                    }
                    else if (status === 'Committed') {
                        return [2 /*return*/, txId];
                    }
                    else {
                        throw new Error('Unknown status type.');
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
function waitTxEvm(txHash, tryCount) {
    if (tryCount === void 0) { tryCount = 10; }
    return __awaiter(this, void 0, void 0, function () {
        var receipt;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (tryCount <= 0) {
                        throw new Error('Timeout');
                    }
                    return [4 /*yield*/, web3.eth.getTransactionReceipt(txHash)];
                case 1:
                    receipt = _a.sent();
                    if (!!receipt) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = resolve;
                                            return [4 /*yield*/, waitTxEvm(txHash, tryCount - 1)];
                                        case 1:
                                            _a.apply(void 0, [_b.sent()]);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, 1000);
                        })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    if (receipt.status) {
                        return [2 /*return*/, txHash];
                    }
                    else {
                        throw new Error('Transaction reverted.');
                    }
                case 4: return [2 /*return*/];
            }
        });
    });
}
//TODO: There is no getTxStatus on C chain. Switch the current setup once that is ready
function waitTxC(cAddress, nonce, tryCount) {
    if (tryCount === void 0) { tryCount = 10; }
    return __awaiter(this, void 0, void 0, function () {
        var nonceNow;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (tryCount <= 0) {
                        throw new Error('Timeout');
                    }
                    return [4 /*yield*/, web3.eth.getTransactionCount(cAddress)];
                case 1:
                    nonceNow = _a.sent();
                    if (typeof nonce === 'undefined') {
                        nonce = nonceNow;
                    }
                    if (!(nonce === nonceNow)) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _a = resolve;
                                            return [4 /*yield*/, waitTxC(cAddress, nonce, tryCount - 1)];
                                        case 1:
                                            _a.apply(void 0, [_b.sent()]);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, 1000);
                        })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3: return [2 /*return*/, 'success'];
            }
        });
    });
}
var payloadtypes = utils$2.PayloadTypes.getInstance();
function parseNftPayload(rawPayload) {
    var payload = avalanche$1.Buffer.from(rawPayload, 'base64');
    payload = avalanche$1.Buffer.concat([new avalanche$1.Buffer(4).fill(payload.length), payload]);
    var typeId = payloadtypes.getTypeID(payload);
    var pl = payloadtypes.getContent(payload);
    var payloadbase = payloadtypes.select(typeId, pl);
    return payloadbase;
}

var utils$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    bnToBig: bnToBig,
    bnToBigAvaxX: bnToBigAvaxX,
    bnToBigAvaxP: bnToBigAvaxP,
    bnToBigAvaxC: bnToBigAvaxC,
    bnToAvaxC: bnToAvaxC,
    bnToAvaxX: bnToAvaxX,
    bnToAvaxP: bnToAvaxP,
    numberToBN: numberToBN,
    bnToLocaleString: bnToLocaleString,
    getAvaxPrice: getAvaxPrice,
    isValidAddress: isValidAddress,
    digestMessage: digestMessage,
    waitTxX: waitTxX,
    waitTxP: waitTxP,
    waitTxEvm: waitTxEvm,
    waitTxC: waitTxC,
    parseNftPayload: parseNftPayload
});

var DEFAULT_TOKENS = [
    {
        chainId: 43114,
        address: '0x60781C2586D68229fde47564546784ab3fACA982',
        decimals: 18,
        name: 'Pangolin',
        symbol: 'PNG',
    },
    {
        chainId: 43114,
        address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
        decimals: 18,
        name: 'Wrapped AVAX',
        symbol: 'WAVAX',
    },
    {
        chainId: 43114,
        address: '0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15',
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    {
        chainId: 43114,
        address: '0xde3A24028580884448a5397872046a019649b084',
        decimals: 6,
        name: 'Tether USD',
        symbol: 'USDT',
    },
    {
        chainId: 43114,
        address: '0xB3fe5374F67D7a22886A0eE082b2E2f9d2651651',
        decimals: 18,
        name: 'ChainLink Token',
        symbol: 'LINK',
    },
    {
        chainId: 43114,
        address: '0x8cE2Dee54bB9921a2AE0A63dBb2DF8eD88B91dD9',
        decimals: 18,
        name: 'Aave Token',
        symbol: 'AAVE',
    },
    {
        chainId: 43114,
        address: '0xf39f9671906d8630812f9d9863bBEf5D523c84Ab',
        decimals: 18,
        name: 'Uniswap',
        symbol: 'UNI',
    },
    {
        chainId: 43114,
        address: '0x408D4cD0ADb7ceBd1F1A1C33A0Ba2098E1295bAB',
        decimals: 8,
        name: 'Wrapped BTC',
        symbol: 'WBTC',
    },
    {
        chainId: 43114,
        address: '0x8DF92E9C0508aB0030d432DA9F2C65EB1Ee97620',
        decimals: 18,
        name: 'Maker',
        symbol: 'MKR',
    },
    {
        chainId: 43114,
        address: '0x68e44C4619db40ae1a0725e77C02587bC8fBD1c9',
        decimals: 18,
        name: 'Synthetix Network Token',
        symbol: 'SNX',
    },
    {
        chainId: 43114,
        address: '0x53CEedB4f6f277edfDDEdB91373B044FE6AB5958',
        decimals: 18,
        name: 'Compound',
        symbol: 'COMP',
    },
    {
        chainId: 43114,
        address: '0x421b2a69b886BA17a61C7dAd140B9070d5Ef300B',
        decimals: 18,
        name: 'HuobiToken',
        symbol: 'HT',
    },
    {
        chainId: 43114,
        address: '0x39cf1BD5f15fb22eC3D9Ff86b0727aFc203427cc',
        decimals: 18,
        name: 'SushiToken',
        symbol: 'SUSHI',
    },
    {
        chainId: 43114,
        address: '0xC84d7bfF2555955b44BDF6A307180810412D751B',
        decimals: 18,
        name: 'UMA Voting Token v1',
        symbol: 'UMA',
    },
    {
        chainId: 43114,
        address: '0xaEb044650278731Ef3DC244692AB9F64C78FfaEA',
        decimals: 18,
        name: 'Binance USD',
        symbol: 'BUSD',
    },
    {
        chainId: 43114,
        address: '0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a',
        decimals: 18,
        name: 'Dai Stablecoin',
        symbol: 'DAI',
    },
];
var erc20Store = {};
function addErc20Token(address) {
    return __awaiter(this, void 0, void 0, function () {
        var data, token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (erc20Store[address]) {
                        throw new Error(address + " ERC20 token is already added.");
                    }
                    return [4 /*yield*/, Erc20Token.getData(address)];
                case 1:
                    data = _a.sent();
                    token = new Erc20Token(data);
                    erc20Store[address] = token;
                    return [2 /*return*/, token];
            }
        });
    });
}
function getContractData(address) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Erc20Token.getData(address)];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data];
            }
        });
    });
}
function getErc20Token(address) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (erc20Store[address]) {
                return [2 /*return*/, erc20Store[address]];
            }
            else {
                return [2 /*return*/, addErc20Token(address)];
            }
        });
    });
}
function balanceOf(address) {
    return __awaiter(this, void 0, void 0, function () {
        var balance, _a, _b, _i, tokenAddress, token, bal;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    balance = {};
                    _a = [];
                    for (_b in erc20Store)
                        _a.push(_b);
                    _i = 0;
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    tokenAddress = _a[_i];
                    token = erc20Store[tokenAddress];
                    if (!(token.chainId === (activeNetwork$1 === null || activeNetwork$1 === void 0 ? void 0 : activeNetwork$1.evmChainID))) return [3 /*break*/, 3];
                    return [4 /*yield*/, token.balanceOf(address)];
                case 2:
                    bal = _c.sent();
                    balance[tokenAddress] = {
                        name: token.name,
                        symbol: token.symbol,
                        denomination: token.decimals,
                        balance: bal,
                        balanceParsed: bnToLocaleString(bal, token.decimals),
                        address: tokenAddress,
                    };
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, balance];
            }
        });
    });
}
function initStore() {
    DEFAULT_TOKENS.forEach(function (token) {
        erc20Store[token.address] = new Erc20Token(token);
    });
}
initStore();

var Erc20 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    erc20Store: erc20Store,
    addErc20Token: addErc20Token,
    getContractData: getContractData,
    getErc20Token: getErc20Token,
    balanceOf: balanceOf
});

// Copyright Joyent, Inc. and other Node contributors.

var R = typeof Reflect === 'object' ? Reflect : null;
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  };

var ReflectOwnKeys;
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
};

function EventEmitter() {
  EventEmitter.init.call(this);
}
var events = EventEmitter;
var once_1 = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    }
    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}
events.once = once_1;

/**
 * Returns transactions FROM and TO the address given
 * @param addr The address to get historic transactions for.
 */
function getAddressHistoryEVM(addr) {
    return __awaiter(this, void 0, void 0, function () {
        var endpoint, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!explorer_api) {
                        throw NO_EXPLORER_API;
                    }
                    endpoint = "v2/ctransactions?address=" + addr;
                    return [4 /*yield*/, explorer_api.get(endpoint)];
                case 1:
                    data = (_a.sent()).data.Transactions;
                    data.sort(function (a, b) {
                        var dateA = new Date(a.createdAt);
                        var dateB = new Date(b.createdAt);
                        return dateB.getTime() - dateA.getTime();
                    });
                    return [2 /*return*/, data];
            }
        });
    });
}
function getAddressHistory(addrs, limit, chainID, endTime) {
    if (limit === void 0) { limit = 20; }
    return __awaiter(this, void 0, void 0, function () {
        var ADDR_SIZE, selection, remaining, addrsRaw, rootUrl, req, res, txs, next, endTime_1, nextRes, nextRes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!explorer_api) {
                        throw NO_EXPLORER_API;
                    }
                    ADDR_SIZE = 1024;
                    selection = addrs.slice(0, ADDR_SIZE);
                    remaining = addrs.slice(ADDR_SIZE);
                    addrsRaw = selection.map(function (addr) {
                        return addr.split('-')[1];
                    });
                    rootUrl = 'v2/transactions';
                    req = {
                        address: addrsRaw,
                        sort: ['timestamp-desc'],
                        disableCount: ['1'],
                        chainID: [chainID],
                        disableGenesis: ['false'],
                    };
                    if (limit > 0) {
                        //@ts-ignore
                        req.limit = [limit.toString()];
                    }
                    if (endTime) {
                        //@ts-ignore
                        req.endTime = [endTime];
                    }
                    return [4 /*yield*/, explorer_api.post(rootUrl, req)];
                case 1:
                    res = _a.sent();
                    txs = res.data.transactions;
                    next = res.data.next;
                    if (txs === null)
                        txs = [];
                    if (!(next && !limit)) return [3 /*break*/, 3];
                    endTime_1 = next.split('&')[0].split('=')[1];
                    return [4 /*yield*/, getAddressHistory(selection, limit, chainID, endTime_1)];
                case 2:
                    nextRes = _a.sent();
                    txs.push.apply(txs, nextRes);
                    _a.label = 3;
                case 3:
                    if (!(remaining.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, getAddressHistory(remaining, limit, chainID)];
                case 4:
                    nextRes = _a.sent();
                    txs.push.apply(txs, nextRes);
                    _a.label = 5;
                case 5: return [2 /*return*/, txs];
            }
        });
    });
}
function getTransactionSummary(tx, walletAddrs, evmAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var sum, cleanAddressesXP, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    cleanAddressesXP = walletAddrs.map(function (addr) { return addr.split('-')[1]; });
                    _a = tx.type;
                    switch (_a) {
                        case 'import': return [3 /*break*/, 1];
                        case 'pvm_import': return [3 /*break*/, 1];
                        case 'export': return [3 /*break*/, 2];
                        case 'pvm_export': return [3 /*break*/, 2];
                        case 'atomic_export_tx': return [3 /*break*/, 2];
                        case 'add_validator': return [3 /*break*/, 3];
                        case 'add_delegator': return [3 /*break*/, 4];
                        case 'atomic_import_tx': return [3 /*break*/, 5];
                        case 'operation': return [3 /*break*/, 6];
                        case 'base': return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 8];
                case 1:
                    sum = getImportSummary(tx, cleanAddressesXP);
                    return [3 /*break*/, 9];
                case 2:
                    sum = getExportSummary(tx, cleanAddressesXP);
                    return [3 /*break*/, 9];
                case 3:
                    sum = getValidatorSummary(tx, cleanAddressesXP);
                    return [3 /*break*/, 9];
                case 4:
                    sum = getValidatorSummary(tx, cleanAddressesXP);
                    return [3 /*break*/, 9];
                case 5:
                    sum = getImportSummaryC(tx, evmAddress);
                    return [3 /*break*/, 9];
                case 6: return [4 /*yield*/, getBaseTxSummary(tx, cleanAddressesXP)];
                case 7:
                    sum = _b.sent();
                    return [3 /*break*/, 9];
                case 8: throw new Error("Unsupported history transaction type. (" + tx.type + ")");
                case 9: return [2 /*return*/, sum];
            }
        });
    });
}
function getTransactionSummaryEVM(tx, walletAddress) {
    var isSender = tx.fromAddr.toUpperCase() === walletAddress.toUpperCase();
    var amt = new avalanche$1.BN(tx.value);
    var amtClean = bnToAvaxC(amt);
    var date = new Date(tx.createdAt);
    var gasLimit = new avalanche$1.BN(tx.gasLimit);
    var gasPrice = new avalanche$1.BN(tx.gasPrice);
    var feeBN = gasLimit.mul(gasPrice); // in gwei
    return {
        id: tx.hash,
        fee: feeBN,
        memo: '',
        hash: tx.hash,
        block: tx.block,
        isSender: isSender,
        type: 'transaction_evm',
        amount: amt,
        amountClean: amtClean,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        from: tx.fromAddr,
        to: tx.toAddr,
        timestamp: date,
    };
}
function idToChainAlias(id) {
    if (id === activeNetwork$1.xChainID) {
        return 'X';
    }
    else if (id === activeNetwork$1.pChainID) {
        return 'P';
    }
    else if (id === activeNetwork$1.cChainID) {
        return 'C';
    }
    throw new Error('Unknown chain ID.');
}
// If any of the outputs has a different chain ID, thats the destination chain
// else return current chain
function findDestinationChain(tx) {
    var baseChain = tx.chainID;
    var outs = tx.outputs || [];
    for (var i = 0; i < outs.length; i++) {
        var outChainId = outs[i].outChainID;
        if (outChainId !== baseChain)
            return outChainId;
    }
    return baseChain;
}
// If any of the inputs has a different chain ID, thats the source chain
// else return current chain
function findSourceChain(tx) {
    var baseChain = tx.chainID;
    var ins = tx.inputs;
    for (var i = 0; i < ins.length; i++) {
        var inChainId = ins[i].output.inChainID;
        if (inChainId !== baseChain)
            return inChainId;
    }
    return baseChain;
}
function isOutputOwner(ownerAddrs, output) {
    var outAddrs = output.addresses;
    if (!outAddrs)
        return false;
    var totAddrs = outAddrs.filter(function (addr) {
        return ownerAddrs.includes(addr);
    });
    return totAddrs.length > 0;
}
function isOutputOwnerC(ownerAddr, output) {
    var outAddrs = output.caddresses;
    if (!outAddrs)
        return false;
    return outAddrs.includes(ownerAddr);
}
/**
 * Returns the total amount of `assetID` in the given `utxos` owned by `address`. Checks for X/P addresses.
 * @param utxos UTXOs to calculate balance from.
 * @param addresses The wallet's  addresses.
 * @param assetID Only count outputs of this asset ID.
 * @param chainID Only count the outputs on this chain.
 * @param isStake Set to `true` if looking for staking utxos.
 */
function getAssetBalanceFromUTXOs(utxos, addresses, assetID, chainID, isStake) {
    if (isStake === void 0) { isStake = false; }
    var myOuts = utxos.filter(function (utxo) {
        if (assetID === utxo.assetID &&
            isOutputOwner(addresses, utxo) &&
            chainID === utxo.chainID &&
            utxo.stake === isStake) {
            return true;
        }
        return false;
    });
    var tot = myOuts.reduce(function (acc, utxo) {
        return acc.add(new avalanche$1.BN(utxo.amount));
    }, new avalanche$1.BN(0));
    return tot;
}
function getNFTBalanceFromUTXOs(utxos, addresses, assetID) {
    var nftUTXOs = utxos.filter(function (utxo) {
        if (utxo.outputType === avm.AVMConstants.NFTXFEROUTPUTID &&
            utxo.assetID === assetID &&
            isOutputOwner(addresses, utxo)) {
            return true;
        }
        return false;
    });
    var res = {};
    for (var i = 0; i < nftUTXOs.length; i++) {
        var utxo = nftUTXOs[i];
        var groupID = utxo.groupID;
        var content = void 0;
        if (utxo.payload) {
            var parsedPayload = parseNftPayload(utxo.payload);
            content = parsedPayload.getContent().toString();
        }
        if (res[groupID]) {
            res[groupID].amount++;
        }
        else {
            res[groupID] = {
                payload: content || '',
                amount: 1,
            };
        }
    }
    return res;
}
/**
 * Returns the total amount of `assetID` in the given `utxos` owned by `address`. Checks for EVM address.
 * @param utxos UTXOs to calculate balance from.
 * @param address The wallet's  evm address `0x...`.
 * @param assetID Only count outputs of this asset ID.
 * @param chainID Only count the outputs on this chain.
 * @param isStake Set to `true` if looking for staking utxos.
 */
function getEvmAssetBalanceFromUTXOs(utxos, address, assetID, chainID, isStake) {
    if (isStake === void 0) { isStake = false; }
    var myOuts = utxos.filter(function (utxo) {
        if (assetID === utxo.assetID &&
            isOutputOwnerC(address, utxo) &&
            chainID === utxo.chainID &&
            utxo.stake === isStake) {
            return true;
        }
        return false;
    });
    var tot = myOuts.reduce(function (acc, utxo) {
        return acc.add(new avalanche$1.BN(utxo.amount));
    }, new avalanche$1.BN(0));
    return tot;
}
function getImportSummary(tx, addresses) {
    var sourceChain = findSourceChain(tx);
    var chainAliasFrom = idToChainAlias(sourceChain);
    var chainAliasTo = idToChainAlias(tx.chainID);
    var avaxID = activeNetwork$1.avaxID;
    var outs = tx.outputs || [];
    var amtOut = getAssetBalanceFromUTXOs(outs, addresses, avaxID, tx.chainID);
    var time = new Date(tx.timestamp);
    var fee = xChain.getTxFee();
    var res = {
        id: tx.id,
        memo: parseMemo(tx.memo),
        source: chainAliasFrom,
        destination: chainAliasTo,
        amount: amtOut,
        amountClean: bnToAvaxX(amtOut),
        timestamp: time,
        type: 'import',
        fee: fee,
    };
    return res;
}
function getExportSummary(tx, addresses) {
    var inputs = tx.inputs;
    var sourceChain = inputs[0].output.chainID;
    var chainAliasFrom = idToChainAlias(sourceChain);
    var destinationChain = findDestinationChain(tx);
    var chainAliasTo = idToChainAlias(destinationChain);
    var avaxID = activeNetwork$1.avaxID;
    var outs = tx.outputs || [];
    var amtOut = getAssetBalanceFromUTXOs(outs, addresses, avaxID, destinationChain);
    // let amtIn = getAssetBalanceFromUTXOs(inUtxos, addresses, avaxID);
    var time = new Date(tx.timestamp);
    var fee = xChain.getTxFee();
    var res = {
        id: tx.id,
        memo: parseMemo(tx.memo),
        source: chainAliasFrom,
        destination: chainAliasTo,
        amount: amtOut,
        amountClean: bnToAvaxX(amtOut),
        timestamp: time,
        type: 'export',
        fee: fee,
    };
    return res;
}
function getValidatorSummary(tx, ownerAddrs) {
    var time = new Date(tx.timestamp);
    var pChainID = activeNetwork$1.pChainID;
    var avaxID = activeNetwork$1.avaxID;
    var outs = tx.outputs || [];
    var stakeAmt = getAssetBalanceFromUTXOs(outs, ownerAddrs, avaxID, pChainID, true);
    return {
        id: tx.id,
        nodeID: tx.validatorNodeID,
        stakeStart: new Date(tx.validatorStart * 1000),
        stakeEnd: new Date(tx.validatorEnd * 1000),
        timestamp: time,
        type: 'add_validator',
        fee: new avalanche$1.BN(0),
        amount: stakeAmt,
        amountClean: bnToAvaxP(stakeAmt),
        memo: parseMemo(tx.memo),
        isRewarded: tx.rewarded,
    };
}
// Returns the summary for a C chain import TX
function getImportSummaryC(tx, ownerAddr) {
    var sourceChain = findSourceChain(tx);
    var chainAliasFrom = idToChainAlias(sourceChain);
    var chainAliasTo = idToChainAlias(tx.chainID);
    var avaxID = activeNetwork$1.avaxID;
    var outs = tx.outputs || [];
    var amtOut = getEvmAssetBalanceFromUTXOs(outs, ownerAddr, avaxID, tx.chainID);
    var time = new Date(tx.timestamp);
    var fee = xChain.getTxFee();
    var res = {
        id: tx.id,
        source: chainAliasFrom,
        destination: chainAliasTo,
        amount: amtOut,
        amountClean: bnToAvaxX(amtOut),
        timestamp: time,
        type: 'import',
        fee: fee,
        memo: parseMemo(tx.memo),
    };
    return res;
}
function getBaseTxSummary(tx, ownerAddrs) {
    return __awaiter(this, void 0, void 0, function () {
        var losses, lossesNFT, gains, gainsNFT, received, receivedNFTs, _a, _b, _i, assetID, fromAddrs, tokenDesc, amtBN, _c, _d, _e, assetID, fromAddrs, tokenDesc, groups, sent, sentNFTs, _f, _g, _h, assetID, toAddrs, tokenDesc, amtBN, _j, _k, _l, assetID, fromAddrs, tokenDesc, groups;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    losses = getBaseTxTokenLosses(tx, ownerAddrs);
                    lossesNFT = getBaseTxNFTLosses(tx, ownerAddrs);
                    gains = getBaseTxTokenGains(tx, ownerAddrs);
                    gainsNFT = getBaseTxNFTGains(tx, ownerAddrs);
                    received = {};
                    receivedNFTs = {};
                    _a = [];
                    for (_b in gains)
                        _a.push(_b);
                    _i = 0;
                    _m.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    assetID = _a[_i];
                    fromAddrs = getBaseTxSenders(tx, assetID);
                    return [4 /*yield*/, getAssetDescription(assetID)];
                case 2:
                    tokenDesc = _m.sent();
                    amtBN = gains[assetID];
                    received[assetID] = {
                        amount: amtBN,
                        amountClean: bnToLocaleString(amtBN, tokenDesc.denomination),
                        from: fromAddrs,
                        asset: tokenDesc,
                    };
                    _m.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    _c = [];
                    for (_d in gainsNFT)
                        _c.push(_d);
                    _e = 0;
                    _m.label = 5;
                case 5:
                    if (!(_e < _c.length)) return [3 /*break*/, 8];
                    assetID = _c[_e];
                    fromAddrs = getBaseTxSenders(tx, assetID);
                    return [4 /*yield*/, getAssetDescription(assetID)];
                case 6:
                    tokenDesc = _m.sent();
                    groups = gainsNFT[assetID];
                    receivedNFTs[assetID] = {
                        groups: groups,
                        from: fromAddrs,
                        asset: tokenDesc,
                    };
                    _m.label = 7;
                case 7:
                    _e++;
                    return [3 /*break*/, 5];
                case 8:
                    sent = {};
                    sentNFTs = {};
                    _f = [];
                    for (_g in losses)
                        _f.push(_g);
                    _h = 0;
                    _m.label = 9;
                case 9:
                    if (!(_h < _f.length)) return [3 /*break*/, 12];
                    assetID = _f[_h];
                    toAddrs = getBaseTxReceivers(tx, assetID);
                    return [4 /*yield*/, getAssetDescription(assetID)];
                case 10:
                    tokenDesc = _m.sent();
                    amtBN = losses[assetID];
                    sent[assetID] = {
                        amount: amtBN,
                        amountClean: bnToLocaleString(amtBN, tokenDesc.denomination),
                        to: toAddrs,
                        asset: tokenDesc,
                    };
                    _m.label = 11;
                case 11:
                    _h++;
                    return [3 /*break*/, 9];
                case 12:
                    _j = [];
                    for (_k in lossesNFT)
                        _j.push(_k);
                    _l = 0;
                    _m.label = 13;
                case 13:
                    if (!(_l < _j.length)) return [3 /*break*/, 16];
                    assetID = _j[_l];
                    fromAddrs = getBaseTxSenders(tx, assetID);
                    return [4 /*yield*/, getAssetDescription(assetID)];
                case 14:
                    tokenDesc = _m.sent();
                    groups = lossesNFT[assetID];
                    sentNFTs[assetID] = {
                        groups: groups,
                        to: fromAddrs,
                        asset: tokenDesc,
                    };
                    _m.label = 15;
                case 15:
                    _l++;
                    return [3 /*break*/, 13];
                case 16: return [2 /*return*/, {
                        id: tx.id,
                        fee: xChain.getTxFee(),
                        type: 'transaction',
                        timestamp: new Date(tx.timestamp),
                        memo: parseMemo(tx.memo),
                        tokens: {
                            sent: sent,
                            received: received,
                        },
                        nfts: {
                            sent: sentNFTs,
                            received: receivedNFTs,
                        },
                    }];
            }
        });
    });
}
function getBaseTxNFTLosses(tx, ownerAddrs) {
    var inUTXOs = tx.inputs.map(function (input) { return input.output; });
    var nftUTXOs = inUTXOs.filter(function (utxo) {
        return utxo.outputType === avm.AVMConstants.NFTXFEROUTPUTID;
    });
    var res = {};
    for (var assetID in tx.inputTotals) {
        var nftBal = getNFTBalanceFromUTXOs(nftUTXOs, ownerAddrs, assetID);
        // If empty dictionary pass
        if (Object.keys(nftBal).length === 0)
            continue;
        res[assetID] = nftBal;
    }
    return res;
}
function getBaseTxNFTGains(tx, ownerAddrs) {
    var outs = tx.outputs || [];
    var nftUTXOs = outs.filter(function (utxo) {
        return utxo.outputType === avm.AVMConstants.NFTXFEROUTPUTID;
    });
    var res = {};
    for (var assetID in tx.inputTotals) {
        var nftBal = getNFTBalanceFromUTXOs(nftUTXOs, ownerAddrs, assetID);
        // If empty dictionary pass
        if (Object.keys(nftBal).length === 0)
            continue;
        res[assetID] = nftBal;
    }
    return res;
}
function getBaseTxTokenLosses(tx, ownerAddrs) {
    var inUTXOs = tx.inputs.map(function (input) { return input.output; });
    var tokenUTXOs = inUTXOs.filter(function (utxo) {
        return utxo.outputType === avm.AVMConstants.SECPXFEROUTPUTID;
    });
    var chainID = xChain.getBlockchainID();
    var res = {};
    for (var assetID in tx.inputTotals) {
        var bal = getAssetBalanceFromUTXOs(tokenUTXOs, ownerAddrs, assetID, chainID);
        if (bal.isZero())
            continue;
        res[assetID] = bal;
    }
    return res;
}
function getBaseTxTokenGains(tx, ownerAddrs) {
    var chainID = xChain.getBlockchainID();
    var outs = tx.outputs || [];
    var tokenUTXOs = outs.filter(function (utxo) {
        return utxo.outputType === avm.AVMConstants.SECPXFEROUTPUTID;
    });
    var res = {};
    for (var assetID in tx.outputTotals) {
        var bal = getAssetBalanceFromUTXOs(tokenUTXOs, ownerAddrs, assetID, chainID);
        if (bal.isZero())
            continue;
        res[assetID] = bal;
    }
    return res;
}
// Look at the inputs and check where the assetID came from.
function getBaseTxSenders(tx, assetID) {
    var inUTXOs = tx.inputs.map(function (input) { return input.output; });
    var res = [];
    for (var i = 0; i < inUTXOs.length; i++) {
        var utxo = inUTXOs[i];
        if (utxo.assetID === assetID && utxo.addresses) {
            res.push.apply(res, utxo.addresses);
        }
    }
    // Eliminate Duplicates
    return res.filter(function (addr, i) {
        return res.indexOf(addr) === i;
    });
}
// Look at the inputs and check where the assetID came from.
function getBaseTxReceivers(tx, assetID) {
    var res = [];
    var outs = tx.outputs || [];
    for (var i = 0; i < outs.length; i++) {
        var utxo = outs[i];
        if (utxo.assetID === assetID && utxo.addresses) {
            res.push.apply(res, utxo.addresses);
        }
    }
    // Eliminate Duplicates
    return res.filter(function (addr, i) {
        return res.indexOf(addr) === i;
    });
}
function parseMemo(raw) {
    var memoText = new Buffer(raw, 'base64').toString('utf8');
    // Bug that sets memo to empty string (AAAAAA==) for some tx types
    if (!memoText.length || raw === 'AAAAAA==')
        return '';
    return memoText;
}

// import { updateFilterAddresses } from '@/Network/socket_manager';
var WalletProvider = /** @class */ (function () {
    function WalletProvider() {
        this.emitter = new events();
        /**
         * The X chain UTXOs of the wallet's current state
         */
        this.utxosX = new avm.UTXOSet();
        /**
         * The P chain UTXOs of the wallet's current state
         */
        this.utxosP = new platformvm.UTXOSet();
        this.balanceX = {};
        this.balanceERC20 = {};
        WalletProvider.instances.push(this);
    }
    /**
     * Refreshes X chain UTXOs for every wallet instance
     */
    WalletProvider.refreshInstanceBalancesX = function () {
        var wallets = WalletProvider.instances;
        wallets.forEach(function (w) {
            w.getUtxosX();
        });
    };
    /**
     * Refreshes X chain UTXOs for every wallet instance
     */
    WalletProvider.refreshInstanceBalancesC = function () {
        var wallets = WalletProvider.instances;
        wallets.forEach(function (w) {
            w.updateAvaxBalanceC();
        });
    };
    /**
     * Call this when you are done with a wallet instance.
     * You MUST call this function to avoid memory leaks.
     */
    WalletProvider.prototype.destroy = function () {
        var index = WalletProvider.instances.indexOf(this);
        WalletProvider.instances.splice(index, 1);
    };
    WalletProvider.prototype.on = function (event, listener) {
        this.emitter.on(event, listener);
    };
    WalletProvider.prototype.off = function (event, listener) {
        this.emitter.off(event, listener);
    };
    WalletProvider.prototype.emit = function (event, args) {
        this.emitter.emit(event, args);
    };
    WalletProvider.prototype.emitAddressChange = function () {
        this.emit('addressChanged', {
            X: this.getAddressX(),
            changeX: this.getChangeAddressX(),
            P: this.getAddressP(),
        });
    };
    WalletProvider.prototype.emitBalanceChangeX = function () {
        this.emit('balanceChangedX', this.balanceX);
    };
    WalletProvider.prototype.emitBalanceChangeP = function () {
        this.emit('balanceChangedP', this.getAvaxBalanceP());
    };
    WalletProvider.prototype.emitBalanceChangeC = function () {
        this.emit('balanceChangedC', this.getAvaxBalanceC());
    };
    /**
     *
     * @param to - the address funds are being send to.
     * @param amount - amount of AVAX to send in nAVAX
     * @param memo - A MEMO for the transaction
     */
    WalletProvider.prototype.sendAvaxX = function (to, amount, memo) {
        return __awaiter(this, void 0, void 0, function () {
            var memoBuff, froms, changeAddress, utxoSet, tx, signedTx, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!activeNetwork$1)
                            throw NO_NETWORK;
                        memoBuff = memo ? avalanche$1.Buffer.from(memo) : undefined;
                        froms = this.getAllAddressesX();
                        changeAddress = this.getChangeAddressX();
                        utxoSet = this.utxosX;
                        return [4 /*yield*/, xChain.buildBaseTx(utxoSet, amount, activeNetwork$1.avaxID, [to], froms, [changeAddress], memoBuff)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, this.signX(tx)];
                    case 2:
                        signedTx = _a.sent();
                        return [4 /*yield*/, xChain.issueTx(signedTx)];
                    case 3:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxX(txId)];
                    case 4:
                        _a.sent();
                        // Update UTXOs
                        this.getUtxosX();
                        return [2 /*return*/, txId];
                }
            });
        });
    };
    /**
     * Sends AVAX to another address on the C chain.
     * @param to Hex address to send AVAX to.
     * @param amount Amount of AVAX to send, represented in WEI format.
     * @param gasPrice Gas price in WEI format
     * @param gasLimit Gas limit
     *
     * @return Returns the transaction hash
     */
    WalletProvider.prototype.sendAvaxC = function (to, amount, gasPrice, gasLimit) {
        return __awaiter(this, void 0, void 0, function () {
            var fromAddr, tx, signedTx, txHex, hash, txHash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fromAddr = this.getAddressC();
                        return [4 /*yield*/, buildEvmTransferNativeTx(fromAddr, to, amount, gasPrice, gasLimit)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, this.signEvm(tx)];
                    case 2:
                        signedTx = _a.sent();
                        txHex = signedTx.serialize().toString('hex');
                        return [4 /*yield*/, web3.eth.sendSignedTransaction('0x' + txHex)];
                    case 3:
                        hash = _a.sent();
                        txHash = hash.transactionHash;
                        return [4 /*yield*/, waitTxEvm(txHash)];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Makes a transfer call on a ERC20 contract.
     * @param to Hex address to transfer tokens to.
     * @param amount Amount of the ERC20 token to send, donated in the token's correct denomination.
     * @param gasPrice Gas price in WEI format
     * @param gasLimit Gas limit
     * @param contractAddress Contract address of the ERC20 token
     */
    WalletProvider.prototype.sendErc20 = function (to, amount, gasPrice, gasLimit, contractAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var fromAddr, tx, signedTx, txHex, hash, txHash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fromAddr = this.getAddressC();
                        return [4 /*yield*/, buildEvmTransferErc20Tx(fromAddr, to, amount, gasPrice, gasLimit, contractAddress)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, this.signEvm(tx)];
                    case 2:
                        signedTx = _a.sent();
                        txHex = signedTx.serialize().toString('hex');
                        return [4 /*yield*/, web3.eth.sendSignedTransaction('0x' + txHex)];
                    case 3:
                        hash = _a.sent();
                        txHash = hash.transactionHash;
                        return [4 /*yield*/, waitTxEvm(txHash)];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the C chain AVAX balance of the wallet in WEI format.
     */
    WalletProvider.prototype.updateAvaxBalanceC = function () {
        return __awaiter(this, void 0, void 0, function () {
            var balOld, balNew;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        balOld = this.evmWallet.getBalance();
                        return [4 /*yield*/, this.evmWallet.updateBalance()];
                    case 1:
                        balNew = _a.sent();
                        if (!balOld.eq(balNew)) {
                            this.emitBalanceChangeC();
                        }
                        return [2 /*return*/, balNew];
                }
            });
        });
    };
    /**
     *  Returns UTXOs on the X chain that belong to this wallet.
     *  - Makes network request.
     *  - Updates `this.utxosX` with new UTXOs
     *  - Calls `this.updateBalanceX()` after success.
     */
    WalletProvider.prototype.getUtxosX = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addresses, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        addresses = this.getAllAddressesX();
                        this.utxosX;
                        _a = this;
                        return [4 /*yield*/, avmGetAllUTXOs(addresses)];
                    case 1:
                        _a.utxosX = _b.sent();
                        this.updateBalanceX();
                        return [2 /*return*/, this.utxosX];
                }
            });
        });
    };
    /**
     *  Returns UTXOs on the P chain that belong to this wallet.
     *  - Makes network request.
     *  - Updates `this.utxosP` with the new UTXOs
     */
    WalletProvider.prototype.getUtxosP = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addresses, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        addresses = this.getAllAddressesP();
                        _a = this;
                        return [4 /*yield*/, platformGetAllUTXOs(addresses)];
                    case 1:
                        _a.utxosP = _b.sent();
                        this.emitBalanceChangeP();
                        return [2 /*return*/, this.utxosP];
                }
            });
        });
    };
    /**
     * Returns the number AVAX staked by this wallet.
     */
    WalletProvider.prototype.getStake = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addrs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addrs = this.getAllAddressesP();
                        return [4 /*yield*/, getStakeForAddresses(addrs)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Requests the balance for each ERC20 contract in the SDK.
     * - Makes network requests.
     * - Updates the value of `this.balanceERC20`
     */
    WalletProvider.prototype.updateBalanceERC20 = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, balanceOf(this.getAddressC())];
                    case 1:
                        _a.balanceERC20 = _b.sent();
                        return [2 /*return*/, this.balanceERC20];
                }
            });
        });
    };
    /**
     * Returns the wallet's balance of the given ERC20 contract
     * @param address ERC20 Contract address
     */
    WalletProvider.prototype.getBalanceERC20 = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var token, bal, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getErc20Token(address)];
                    case 1:
                        token = _a.sent();
                        return [4 /*yield*/, token.balanceOf(this.getAddressC())];
                    case 2:
                        bal = _a.sent();
                        res = {
                            address: address,
                            denomination: token.decimals,
                            balanceParsed: bnToLocaleString(bal, token.decimals),
                            balance: bal,
                            name: token.name,
                            symbol: token.symbol,
                        };
                        return [2 /*return*/, res];
                }
            });
        });
    };
    /**
     * Uses the X chain UTXOs owned by this wallet, gets asset description for unknown assets,
     * and returns a nicely formatted dictionary that represents
     * - Updates `this.balanceX`
     * - Expensive operation if there are unknown assets
     * - Uses existing UTXOs
     * @private
     */
    WalletProvider.prototype.updateBalanceX = function () {
        return __awaiter(this, void 0, void 0, function () {
            var utxos, unixNow, res, i, utxo, out, type, locktime, amount, assetIdBuff, assetId, asset, assetInfo, avaxID, assetInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!activeNetwork$1)
                            throw NO_NETWORK;
                        utxos = this.utxosX.getAllUTXOs();
                        unixNow = utils$2.UnixNow();
                        res = {};
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < utxos.length)) return [3 /*break*/, 5];
                        utxo = utxos[i];
                        out = utxo.getOutput();
                        type = out.getOutputID();
                        if (type != avm.AVMConstants.SECPXFEROUTPUTID)
                            return [3 /*break*/, 4];
                        locktime = out.getLocktime();
                        amount = out.getAmount();
                        assetIdBuff = utxo.getAssetID();
                        assetId = bintools$1.cb58Encode(assetIdBuff);
                        asset = res[assetId];
                        if (!!asset) return [3 /*break*/, 3];
                        return [4 /*yield*/, getAssetDescription(assetId)];
                    case 2:
                        assetInfo = _a.sent();
                        asset = { locked: new avalanche$1.BN(0), unlocked: new avalanche$1.BN(0), meta: assetInfo };
                        _a.label = 3;
                    case 3:
                        if (locktime.lte(unixNow)) {
                            // not locked
                            asset.unlocked = asset.unlocked.add(amount);
                        }
                        else {
                            // locked
                            asset.locked = asset.locked.add(amount);
                        }
                        res[assetId] = asset;
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 1];
                    case 5:
                        avaxID = activeNetwork$1.avaxID;
                        if (!!res[avaxID]) return [3 /*break*/, 7];
                        return [4 /*yield*/, getAssetDescription(avaxID)];
                    case 6:
                        assetInfo = _a.sent();
                        res[avaxID] = {
                            locked: new avalanche$1.BN(0),
                            unlocked: new avalanche$1.BN(0),
                            meta: assetInfo,
                        };
                        _a.label = 7;
                    case 7:
                        this.balanceX = res;
                        this.emitBalanceChangeX();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    /**
     * Returns the X chain AVAX balance of the current wallet state.
     * - Does not make a network request.
     * - Does not refresh wallet balance.
     */
    WalletProvider.prototype.getAvaxBalanceX = function () {
        // checkNetworkConnection()
        if (!activeNetwork$1) {
            throw new Error('Network not selected.');
        }
        return this.balanceX[activeNetwork$1.avaxID];
    };
    WalletProvider.prototype.getAvaxBalanceC = function () {
        return this.evmWallet.getBalance();
    };
    /**
     * Returns the P chain AVAX balance of the current wallet state.
     * - Does not make a network request.
     * - Does not refresh wallet balance.
     */
    WalletProvider.prototype.getAvaxBalanceP = function () {
        var unlocked = new avalanche$1.BN(0);
        var locked = new avalanche$1.BN(0);
        var lockedStakeable = new avalanche$1.BN(0);
        var utxos = this.utxosP.getAllUTXOs();
        var unixNow = utils$2.UnixNow();
        for (var i = 0; i < utxos.length; i++) {
            var utxo = utxos[i];
            var out = utxo.getOutput();
            var type = out.getOutputID();
            var amount = out.getAmount();
            if (type === platformvm.PlatformVMConstants.STAKEABLELOCKOUTID) {
                var locktime = out.getStakeableLocktime();
                if (locktime.lte(unixNow)) {
                    unlocked.iadd(amount);
                }
                else {
                    lockedStakeable = lockedStakeable.add(amount);
                }
            }
            else {
                var locktime = out.getLocktime();
                if (locktime.lte(unixNow)) {
                    unlocked.iadd(amount);
                }
                else {
                    locked.iadd(amount);
                }
            }
        }
        return {
            unlocked: unlocked,
            locked: locked,
            lockedStakeable: lockedStakeable,
        };
    };
    /**
     * Exports AVAX from P chain to X chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @return returns the transaction id.
     */
    WalletProvider.prototype.exportPChain = function (amt) {
        return __awaiter(this, void 0, void 0, function () {
            var fee, amtFee, utxoSet, destinationAddr, pChangeAddr, fromAddrs, xId, exportTx, tx, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fee = xChain.getTxFee();
                        amtFee = amt.add(fee);
                        utxoSet = this.utxosP;
                        destinationAddr = this.getAddressX();
                        pChangeAddr = this.getAddressP();
                        fromAddrs = this.getAllAddressesP();
                        xId = xChain.getBlockchainID();
                        return [4 /*yield*/, pChain.buildExportTx(utxoSet, amtFee, xId, [destinationAddr], fromAddrs, [pChangeAddr])];
                    case 1:
                        exportTx = _a.sent();
                        return [4 /*yield*/, this.signP(exportTx)];
                    case 2:
                        tx = _a.sent();
                        return [4 /*yield*/, pChain.issueTx(tx)];
                    case 3:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxP(txId)];
                    case 4:
                        _a.sent();
                        this.getUtxosP();
                        return [2 /*return*/, txId];
                }
            });
        });
    };
    /**
     * Exports AVAX from C chain to X chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @return returns the transaction id.
     */
    WalletProvider.prototype.exportCChain = function (amt) {
        return __awaiter(this, void 0, void 0, function () {
            var fee, amtFee, hexAddr, bechAddr, fromAddresses, destinationAddr, exportTx, tx, addrC, nonceBefore, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fee = xChain.getTxFee();
                        amtFee = amt.add(fee);
                        hexAddr = this.getAddressC();
                        bechAddr = this.getEvmAddressBech();
                        fromAddresses = [hexAddr];
                        destinationAddr = this.getAddressX();
                        return [4 /*yield*/, buildEvmExportTransaction(fromAddresses, destinationAddr, amtFee, bechAddr)];
                    case 1:
                        exportTx = _a.sent();
                        return [4 /*yield*/, this.signC(exportTx)];
                    case 2:
                        tx = _a.sent();
                        addrC = this.getAddressC();
                        return [4 /*yield*/, web3.eth.getTransactionCount(addrC)];
                    case 3:
                        nonceBefore = _a.sent();
                        return [4 /*yield*/, cChain.issueTx(tx)];
                    case 4:
                        txId = _a.sent();
                        // TODO: Return the txId from the wait function, once support is there
                        return [4 /*yield*/, waitTxC(addrC, nonceBefore)];
                    case 5:
                        // TODO: Return the txId from the wait function, once support is there
                        _a.sent();
                        return [2 /*return*/, txId];
                }
            });
        });
    };
    /**
     * Exports AVAX from X chain to either P or C chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @param destinationChain Which chain to export to.
     * @return returns the transaction id.
     */
    WalletProvider.prototype.exportXChain = function (amt, destinationChain) {
        return __awaiter(this, void 0, void 0, function () {
            var fee, amtFee, destinationAddr, fromAddresses, changeAddress, utxos, exportTx, tx, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fee = xChain.getTxFee();
                        amtFee = amt.add(fee);
                        if (destinationChain === 'P') {
                            destinationAddr = this.getAddressP();
                        }
                        else {
                            // C Chain
                            destinationAddr = this.getEvmAddressBech();
                        }
                        fromAddresses = this.getAllAddressesX();
                        changeAddress = this.getChangeAddressX();
                        utxos = this.utxosX;
                        return [4 /*yield*/, buildAvmExportTransaction(destinationChain, utxos, fromAddresses, destinationAddr, amtFee, changeAddress)];
                    case 1:
                        exportTx = (_a.sent());
                        return [4 /*yield*/, this.signX(exportTx)];
                    case 2:
                        tx = _a.sent();
                        return [4 /*yield*/, xChain.issueTx(tx)];
                    case 3:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxX(txId)];
                    case 4:
                        _a.sent();
                        // Update UTXOs
                        this.getUtxosX();
                        return [2 /*return*/, txId];
                }
            });
        });
    };
    WalletProvider.prototype.getAtomicUTXOsX = function (chainID) {
        return __awaiter(this, void 0, void 0, function () {
            var addrs, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addrs = this.getAllAddressesX();
                        return [4 /*yield*/, avmGetAtomicUTXOs(addrs, chainID)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    WalletProvider.prototype.getAtomicUTXOsP = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addrs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addrs = this.getAllAddressesP();
                        return [4 /*yield*/, platformGetAtomicUTXOs(addrs)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Imports atomic X chain utxos to the current actie X chain address
     * @param chainID The chain ID to import from, either `P` or `C`
     */
    WalletProvider.prototype.importX = function (chainID) {
        return __awaiter(this, void 0, void 0, function () {
            var utxoSet, xToAddr, hrp, utxoAddrs, fromAddrs, ownerAddrs, sourceChainId, unsignedTx, tx, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAtomicUTXOsX(chainID)];
                    case 1:
                        utxoSet = _a.sent();
                        if (utxoSet.getAllUTXOs().length === 0) {
                            throw new Error('Nothing to import.');
                        }
                        xToAddr = this.getAddressX();
                        hrp = avalanche.getHRP();
                        utxoAddrs = utxoSet.getAddresses().map(function (addr) { return bintools$1.addressToString(hrp, 'X', addr); });
                        fromAddrs = utxoAddrs;
                        ownerAddrs = utxoAddrs;
                        if (chainID === 'P') {
                            sourceChainId = pChain.getBlockchainID();
                        }
                        else {
                            sourceChainId = cChain.getBlockchainID();
                        }
                        return [4 /*yield*/, xChain.buildImportTx(utxoSet, ownerAddrs, sourceChainId, [xToAddr], fromAddrs, [
                                xToAddr,
                            ])];
                    case 2:
                        unsignedTx = _a.sent();
                        return [4 /*yield*/, this.signX(unsignedTx)];
                    case 3:
                        tx = _a.sent();
                        return [4 /*yield*/, xChain.issueTx(tx)];
                    case 4:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxX(txId)];
                    case 5:
                        _a.sent();
                        // Update UTXOs
                        this.getUtxosX();
                        return [2 /*return*/, txId];
                }
            });
        });
    };
    WalletProvider.prototype.importP = function () {
        return __awaiter(this, void 0, void 0, function () {
            var utxoSet, pToAddr, hrp, utxoAddrs, ownerAddrs, unsignedTx, tx, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAtomicUTXOsP()];
                    case 1:
                        utxoSet = _a.sent();
                        if (utxoSet.getAllUTXOs().length === 0) {
                            throw new Error('Nothing to import.');
                        }
                        pToAddr = this.getAddressP();
                        hrp = avalanche.getHRP();
                        utxoAddrs = utxoSet.getAddresses().map(function (addr) { return bintools$1.addressToString(hrp, 'P', addr); });
                        ownerAddrs = utxoAddrs;
                        return [4 /*yield*/, pChain.buildImportTx(utxoSet, ownerAddrs, xChain.getBlockchainID(), [pToAddr], [pToAddr], [pToAddr], undefined, undefined)];
                    case 2:
                        unsignedTx = _a.sent();
                        return [4 /*yield*/, this.signP(unsignedTx)];
                    case 3:
                        tx = _a.sent();
                        return [4 /*yield*/, pChain.issueTx(tx)];
                    case 4:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxP(txId)];
                    case 5:
                        _a.sent();
                        this.getUtxosP();
                        return [2 /*return*/, txId];
                }
            });
        });
    };
    WalletProvider.prototype.importC = function () {
        return __awaiter(this, void 0, void 0, function () {
            var bechAddr, utxoResponse, utxoSet, toAddress, ownerAddresses, fromAddresses, sourceChain, unsignedTx, tx, id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bechAddr = this.getEvmAddressBech();
                        return [4 /*yield*/, cChain.getUTXOs(bechAddr, xChain.getBlockchainID())];
                    case 1:
                        utxoResponse = _a.sent();
                        utxoSet = utxoResponse.utxos;
                        if (utxoSet.getAllUTXOs().length === 0) {
                            throw new Error('Nothing to import.');
                        }
                        toAddress = this.getAddressC();
                        ownerAddresses = [bechAddr];
                        fromAddresses = ownerAddresses;
                        sourceChain = xChain.getBlockchainID();
                        return [4 /*yield*/, cChain.buildImportTx(utxoSet, toAddress, ownerAddresses, sourceChain, fromAddresses)];
                    case 2:
                        unsignedTx = _a.sent();
                        return [4 /*yield*/, this.signC(unsignedTx)];
                    case 3:
                        tx = _a.sent();
                        return [4 /*yield*/, cChain.issueTx(tx)];
                    case 4:
                        id = _a.sent();
                        return [2 /*return*/, id];
                }
            });
        });
    };
    WalletProvider.prototype.createNftFamily = function (name, symbol, groupNum) {
        return __awaiter(this, void 0, void 0, function () {
            var fromAddresses, changeAddress, minterAddress, utxoSet, unsignedTx, signed, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fromAddresses = this.getAllAddressesX();
                        changeAddress = this.getChangeAddressX();
                        minterAddress = this.getAddressX();
                        utxoSet = this.utxosX;
                        return [4 /*yield*/, buildCreateNftFamilyTx(name, symbol, groupNum, fromAddresses, minterAddress, changeAddress, utxoSet)];
                    case 1:
                        unsignedTx = _a.sent();
                        return [4 /*yield*/, this.signX(unsignedTx)];
                    case 2:
                        signed = _a.sent();
                        return [4 /*yield*/, xChain.issueTx(signed)];
                    case 3:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxX(txId)];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    WalletProvider.prototype.mintNft = function (mintUtxo, payload, quantity) {
        return __awaiter(this, void 0, void 0, function () {
            var ownerAddress, changeAddress, sourceAddresses, utxoSet, tx, signed, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ownerAddress = this.getAddressX();
                        changeAddress = this.getChangeAddressX();
                        sourceAddresses = this.getAllAddressesX();
                        utxoSet = this.utxosX;
                        return [4 /*yield*/, buildMintNftTx(mintUtxo, payload, quantity, ownerAddress, changeAddress, sourceAddresses, utxoSet)];
                    case 1:
                        tx = _a.sent();
                        return [4 /*yield*/, this.signX(tx)];
                    case 2:
                        signed = _a.sent();
                        return [4 /*yield*/, xChain.issueTx(signed)];
                    case 3:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxX(txId)];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Adds a validator to the network using the given node id.
     *
     * @param nodeID The node id you are adding as a validator
     * @param amt Amount of AVAX to stake in nAVAX
     * @param start Validation period start date
     * @param end Validation period end date
     * @param delegationFee Minimum 2%
     * @param rewardAddress P chain address to send staking rewards
     * @param utxos
     *
     * @return Transaction id
     */
    WalletProvider.prototype.validate = function (nodeID, amt, start, end, delegationFee, rewardAddress, utxos) {
        return __awaiter(this, void 0, void 0, function () {
            var utxoSet, pAddressStrings, stakeAmount, changeAddress, stakeReturnAddr, startTime, endTime, unsignedTx, tx, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utxoSet = this.utxosP;
                        // If given custom UTXO set use that
                        if (utxos) {
                            utxoSet = new platformvm.UTXOSet();
                            utxoSet.addArray(utxos);
                        }
                        pAddressStrings = this.getAllAddressesP();
                        stakeAmount = amt;
                        // If reward address isn't given use index 0 address
                        if (!rewardAddress) {
                            rewardAddress = this.getAddressP();
                        }
                        changeAddress = this.getAddressP();
                        stakeReturnAddr = this.getAddressP();
                        startTime = new avalanche$1.BN(Math.round(start.getTime() / 1000));
                        endTime = new avalanche$1.BN(Math.round(end.getTime() / 1000));
                        return [4 /*yield*/, pChain.buildAddValidatorTx(utxoSet, [stakeReturnAddr], pAddressStrings, // from
                            [changeAddress], // change
                            nodeID, startTime, endTime, stakeAmount, [rewardAddress], delegationFee)];
                    case 1:
                        unsignedTx = _a.sent();
                        return [4 /*yield*/, this.signP(unsignedTx)];
                    case 2:
                        tx = _a.sent();
                        return [4 /*yield*/, pChain.issueTx(tx)];
                    case 3:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxP(txId)];
                    case 4:
                        _a.sent();
                        this.getUtxosP();
                        return [2 /*return*/, txId];
                }
            });
        });
    };
    WalletProvider.prototype.delegate = function (nodeID, amt, start, end, rewardAddress, utxos) {
        return __awaiter(this, void 0, void 0, function () {
            var utxoSet, pAddressStrings, stakeAmount, stakeReturnAddr, changeAddress, startTime, endTime, unsignedTx, tx, txId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        utxoSet = this.utxosP;
                        pAddressStrings = this.getAllAddressesP();
                        stakeAmount = amt;
                        // If given custom UTXO set use that
                        if (utxos) {
                            utxoSet = new platformvm.UTXOSet();
                            utxoSet.addArray(utxos);
                        }
                        // If reward address isn't given use current P address
                        if (!rewardAddress) {
                            rewardAddress = this.getAddressP();
                        }
                        stakeReturnAddr = this.getAddressP();
                        changeAddress = this.getAddressP();
                        startTime = new avalanche$1.BN(Math.round(start.getTime() / 1000));
                        endTime = new avalanche$1.BN(Math.round(end.getTime() / 1000));
                        return [4 /*yield*/, pChain.buildAddDelegatorTx(utxoSet, [stakeReturnAddr], pAddressStrings, [changeAddress], nodeID, startTime, endTime, stakeAmount, [rewardAddress] // reward address
                            )];
                    case 1:
                        unsignedTx = _a.sent();
                        return [4 /*yield*/, this.signP(unsignedTx)];
                    case 2:
                        tx = _a.sent();
                        return [4 /*yield*/, pChain.issueTx(tx)];
                    case 3:
                        txId = _a.sent();
                        return [4 /*yield*/, waitTxP(txId)];
                    case 4:
                        _a.sent();
                        this.getUtxosP();
                        return [2 /*return*/, txId];
                }
            });
        });
    };
    WalletProvider.prototype.getHistoryX = function (limit) {
        if (limit === void 0) { limit = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var addrs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addrs = this.getAllAddressesX();
                        return [4 /*yield*/, getAddressHistory(addrs, limit, xChain.getBlockchainID())];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    WalletProvider.prototype.getHistoryP = function (limit) {
        if (limit === void 0) { limit = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var addrs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addrs = this.getAllAddressesP();
                        return [4 /*yield*/, getAddressHistory(addrs, limit, pChain.getBlockchainID())];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    WalletProvider.prototype.getHistoryC = function (limit) {
        if (limit === void 0) { limit = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var addrs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addrs = [this.getEvmAddressBech()];
                        return [4 /*yield*/, getAddressHistory(addrs, limit, cChain.getBlockchainID())];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    WalletProvider.prototype.getHistoryEVM = function () {
        return __awaiter(this, void 0, void 0, function () {
            var addr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addr = this.getAddressC();
                        return [4 /*yield*/, getAddressHistoryEVM(addr)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    WalletProvider.prototype.getHistory = function (limit) {
        if (limit === void 0) { limit = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var txsX, txsP, txsC, txsXPC, txsEVM, addrs, addrC, parsedXPC, i, tx, summary, err_1, parsedEVM, parsedAll, txsSorted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getHistoryX(limit)];
                    case 1:
                        txsX = _a.sent();
                        return [4 /*yield*/, this.getHistoryP(limit)];
                    case 2:
                        txsP = _a.sent();
                        return [4 /*yield*/, this.getHistoryC(limit)];
                    case 3:
                        txsC = _a.sent();
                        txsXPC = txsX.concat(txsP, txsC);
                        return [4 /*yield*/, this.getHistoryEVM()];
                    case 4:
                        txsEVM = _a.sent();
                        addrs = this.getAllAddressesX();
                        addrC = this.getAddressC();
                        parsedXPC = [];
                        i = 0;
                        _a.label = 5;
                    case 5:
                        if (!(i < txsXPC.length)) return [3 /*break*/, 10];
                        tx = txsXPC[i];
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, getTransactionSummary(tx, addrs, addrC)];
                    case 7:
                        summary = _a.sent();
                        parsedXPC.push(summary);
                        return [3 /*break*/, 9];
                    case 8:
                        err_1 = _a.sent();
                        console.error(err_1);
                        return [3 /*break*/, 9];
                    case 9:
                        i++;
                        return [3 /*break*/, 5];
                    case 10:
                        parsedEVM = txsEVM.map(function (tx) { return getTransactionSummaryEVM(tx, addrC); });
                        parsedAll = __spreadArray(__spreadArray([], parsedXPC), parsedEVM);
                        txsSorted = parsedAll.sort(function (x, y) { return (moment__default['default'](x.timestamp).isBefore(moment__default['default'](y.timestamp)) ? 1 : -1); });
                        // If there is a limit only return that much
                        if (limit > 0) {
                            return [2 /*return*/, txsSorted.slice(0, limit)];
                        }
                        return [2 /*return*/, txsSorted];
                }
            });
        });
    };
    WalletProvider.instances = [];
    return WalletProvider;
}());

//Testing pubsub
var socketX;
var wsUrl = wsUrlFromConfigEVM(DefaultConfig);
var socketEVM = new Web3__default['default'](wsUrl);
var activeNetwork = DefaultConfig;
function setSocketNetwork(config) {
    // Setup X chain connection
    connectSocketX(config);
    // Setup EVM socket connection
    connectSocketEVM(config);
    activeNetwork = config;
}
function connectSocketX(config) {
    if (socketX) {
        socketX.close();
    }
    // Setup the X chain socket connection
    var wsURL = wsUrlFromConfigX(config);
    socketX = new avalanche$1.Socket(wsURL);
    addListenersX(socketX);
}
function connectSocketEVM(config) {
    try {
        var wsUrl_1 = wsUrlFromConfigEVM(config);
        socketEVM.setProvider(wsUrl_1);
        addListenersEVM(socketEVM);
    }
    catch (e) {
        console.info('EVM Websocket connection failed.');
    }
}
/**
 * Add the event listeners to the socket events.
 * @param socket The socket instance to add event listeners to.
 */
function addListenersX(socket) {
    socket.onopen = function () {
        updateFilterAddresses();
    };
    socket.onmessage = function () {
        WalletProvider.refreshInstanceBalancesX();
    };
    socket.onclose = function () { };
    socket.onerror = function (error) {
        console.log(error);
    };
}
function addListenersEVM(provider) {
    var sub = provider.eth.subscribe('newBlockHeaders');
    sub.on('data', blockHeaderCallback);
    sub.on('error', onErrorEVM);
}
function onErrorEVM(err) {
    console.info(err);
    connectSocketEVM(activeNetwork);
}
function blockHeaderCallback() {
    WalletProvider.refreshInstanceBalancesC();
}
var BLOOM_SIZE = 1000;
function updateFilterAddresses() {
    if (!socketX) {
        return;
    }
    var wallets = WalletProvider.instances;
    var addrs = wallets.map(function (w) { return w.getAddressX(); });
    var pubsub = new avalanche$1.PubSub();
    var bloom = pubsub.newBloom(BLOOM_SIZE);
    var addAddrs = pubsub.addAddresses(addrs);
    socketX.send(bloom);
    socketX.send(addAddrs);
}

function setNetwork(conf) {
    setRpcNetwork(conf);
    setSocketNetwork(conf);
}
// Default connection is Mainnet
setNetwork(MainnetConfig);

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    setNetwork: setNetwork
});

// HD WALLET
// Accounts are not used and the account index is fixed to 0
// m / purpose' / coin_type' / account' / change / address_index
var AVAX_TOKEN_INDEX = '9000';
var AVAX_ACCOUNT_PATH = "m/44'/" + AVAX_TOKEN_INDEX + "'/0'"; // Change and index left out
var ETH_ACCOUNT_PATH = "m/44'/60'/0'";
var LEDGER_ETH_ACCOUNT_PATH = ETH_ACCOUNT_PATH + '/0/0';
var INDEX_RANGE = 20; // a gap of at least 20 indexes is needed to claim an index unused
var SCAN_SIZE = 70; // the total number of utxos to look at initially to calculate last index
var SCAN_RANGE = SCAN_SIZE - INDEX_RANGE; // How many items are actually scanned
var LEDGER_EXCHANGE_TIMEOUT = 90000;
var MIN_EVM_SUPPORT_V = '0.5.3';

var EvmWalletReadonly = /** @class */ (function () {
    function EvmWalletReadonly(publicKey) {
        this.balance = new avalanche$1.BN(0);
        this.publicKey = publicKey;
        this.address = '0x' + ethereumjsUtil.publicToAddress(publicKey).toString('hex');
    }
    EvmWalletReadonly.prototype.getBalance = function () {
        return this.balance;
    };
    EvmWalletReadonly.prototype.getAddress = function () {
        return ethers.ethers.utils.getAddress(this.address);
    };
    EvmWalletReadonly.prototype.updateBalance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var bal;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, web3.eth.getBalance(this.address)];
                    case 1:
                        bal = _a.sent();
                        this.balance = new avalanche$1.BN(bal);
                        return [2 /*return*/, this.balance];
                }
            });
        });
    };
    return EvmWalletReadonly;
}());

var EvmWallet = /** @class */ (function (_super) {
    __extends(EvmWallet, _super);
    function EvmWallet(key) {
        var _this = this;
        var pubKey = ethereumjsUtil.privateToPublic(key);
        _this = _super.call(this, pubKey) || this;
        _this.privateKey = key;
        return _this;
    }
    EvmWallet.prototype.getPrivateKeyBech = function () {
        return "PrivateKey-" + bintools$1.cb58Encode(avalanche$1.Buffer.from(this.privateKey));
    };
    EvmWallet.prototype.getKeyChain = function () {
        var keychain = new evm.KeyChain(avalanche.getHRP(), 'C');
        keychain.importKey(this.getPrivateKeyBech());
        return keychain;
    };
    EvmWallet.prototype.getKeyPair = function () {
        var keychain = new evm.KeyChain(avalanche.getHRP(), 'C');
        return keychain.importKey(this.getPrivateKeyBech());
    };
    EvmWallet.prototype.signEVM = function (tx) {
        return tx.sign(this.privateKey);
    };
    EvmWallet.prototype.signC = function (tx) {
        return tx.sign(this.getKeyChain());
    };
    EvmWallet.prototype.getPrivateKeyHex = function () {
        return this.privateKey.toString('hex');
    };
    return EvmWallet;
}(EvmWalletReadonly));

// Given an array of addresses, checks which chain each address was already used on
function getAddressChains(addrs) {
    return __awaiter(this, void 0, void 0, function () {
        var rawAddrs, urlRoot, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!explorer_api) {
                        throw NO_EXPLORER_API;
                    }
                    rawAddrs = addrs.map(function (addr) {
                        return addr.split('-')[1];
                    });
                    urlRoot = "/v2/addressChains";
                    return [4 /*yield*/, explorer_api.post(urlRoot, {
                            address: rawAddrs,
                            disableCount: ['1'],
                        })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.data.addressChains];
            }
        });
    });
}

// Each HD wallet has 2 HdScaners, one for internal chain, one for external
var HdScanner = /** @class */ (function () {
    function HdScanner(accountKey, isInternal) {
        if (isInternal === void 0) { isInternal = true; }
        this.index = 0;
        this.addressCache = {};
        this.keyCacheX = {};
        this.keyCacheP = {};
        this.changePath = isInternal ? '1' : '0';
        this.accountKey = accountKey;
    }
    HdScanner.prototype.getIndex = function () {
        return this.index;
    };
    HdScanner.prototype.increment = function () {
        return this.index++;
    };
    HdScanner.prototype.getAddressX = function () {
        return this.getAddressForIndex(this.index, 'X');
    };
    HdScanner.prototype.getAddressP = function () {
        return this.getAddressForIndex(this.index, 'P');
    };
    HdScanner.prototype.getAllAddresses = function (chainId) {
        if (chainId === void 0) { chainId = 'X'; }
        var upTo = this.index;
        var addrs = [];
        for (var i = 0; i <= upTo; i++) {
            addrs.push(this.getAddressForIndex(i, chainId));
        }
        return addrs;
    };
    HdScanner.prototype.getAddressesInRange = function (start, end) {
        var res = [];
        for (var i = start; i < end; i++) {
            res.push(this.getAddressForIndex(i));
        }
        return res;
    };
    HdScanner.prototype.getKeyChainX = function () {
        var keychain = xChain.newKeyChain();
        for (var i = 0; i <= this.index; i++) {
            var key = this.getKeyForIndexX(i);
            keychain.addKey(key);
        }
        return keychain;
    };
    HdScanner.prototype.getKeyChainP = function () {
        var keychain = pChain.newKeyChain();
        for (var i = 0; i <= this.index; i++) {
            var key = this.getKeyForIndexP(i);
            keychain.addKey(key);
        }
        return keychain;
    };
    HdScanner.prototype.getKeyForIndexX = function (index) {
        var cache = this.keyCacheX[index];
        if (cache)
            return cache;
        var hdKey = this.getHdKeyForIndex(index);
        var pkHex = hdKey.privateKey.toString('hex');
        var pkBuf = new avalanche$1.Buffer(pkHex, 'hex');
        var keychain = xChain.newKeyChain();
        var keypair = keychain.importKey(pkBuf);
        this.keyCacheX[index] = keypair;
        return keypair;
    };
    HdScanner.prototype.getKeyForIndexP = function (index) {
        var cache = this.keyCacheP[index];
        if (cache)
            return cache;
        var hdKey = this.getHdKeyForIndex(index);
        var pkHex = hdKey.privateKey.toString('hex');
        var pkBuf = new avalanche$1.Buffer(pkHex, 'hex');
        var keychain = pChain.newKeyChain();
        var keypair = keychain.importKey(pkBuf);
        this.keyCacheP[index] = keypair;
        return keypair;
    };
    HdScanner.prototype.getHdKeyForIndex = function (index) {
        var key;
        if (this.addressCache[index]) {
            key = this.addressCache[index];
        }
        else {
            key = this.accountKey.derive("m/" + this.changePath + "/" + index);
            this.addressCache[index] = key;
        }
        return key;
    };
    HdScanner.prototype.getAddressForIndex = function (index, chainId) {
        if (chainId === void 0) { chainId = 'X'; }
        var key = this.getHdKeyForIndex(index);
        var publicKey = key.publicKey.toString('hex');
        var publicKeyBuff = avalanche$1.Buffer.from(publicKey, 'hex');
        var hrp = utils$2.getPreferredHRP(avalanche.getNetworkID());
        var keypair = new keychain.KeyPair(hrp, chainId);
        var addrBuf = keypair.addressFromPublicKey(publicKeyBuff);
        var addr = bintools$1.addressToString(hrp, chainId, addrBuf);
        return addr;
    };
    // Uses the explorer to scan used addresses and find its starting index
    HdScanner.prototype.resetIndex = function (startIndex) {
        if (startIndex === void 0) { startIndex = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!activeNetwork$1)
                            throw NO_NETWORK;
                        if (!activeNetwork$1.explorerURL) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.findAvailableIndexExplorer(startIndex)];
                    case 1:
                        index = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.findAvailableIndexNode(startIndex)];
                    case 3:
                        index = _a.sent();
                        _a.label = 4;
                    case 4:
                        this.index = index;
                        return [2 /*return*/, index];
                }
            });
        });
    };
    // Scans the address space of this hd path and finds the last used index using the
    // explorer API.
    HdScanner.prototype.findAvailableIndexExplorer = function (startIndex) {
        if (startIndex === void 0) { startIndex = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var upTo, addrs, addrChains, i, gapSize, n, scanIndex, scanAddr, rawAddr, chains;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        upTo = 512;
                        addrs = this.getAddressesInRange(startIndex, startIndex + upTo);
                        return [4 /*yield*/, getAddressChains(addrs)];
                    case 1:
                        addrChains = _a.sent();
                        for (i = 0; i < addrs.length - INDEX_RANGE; i++) {
                            gapSize = 0;
                            for (n = 0; n < INDEX_RANGE; n++) {
                                scanIndex = i + n;
                                scanAddr = addrs[scanIndex];
                                rawAddr = scanAddr.split('-')[1];
                                chains = addrChains[rawAddr];
                                if (!chains) {
                                    // If doesnt exist on any chain
                                    gapSize++;
                                }
                                else {
                                    i = i + n;
                                    break;
                                }
                            }
                            // If the gap is reached return the index
                            if (gapSize === INDEX_RANGE) {
                                return [2 /*return*/, startIndex + i];
                            }
                        }
                        return [4 /*yield*/, this.findAvailableIndexExplorer(startIndex + (upTo - INDEX_RANGE))];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Uses the node to find last used HD index
    // Only used when there is no explorer API available
    HdScanner.prototype.findAvailableIndexNode = function (start) {
        if (start === void 0) { start = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var addrsX, addrsP, i, addressX, addressP, utxoSetX, utxoSetP, i, gapSize, n, scanIndex, addr, addrBuf, addrUTXOsX, addrUTXOsP, targetIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        addrsX = [];
                        addrsP = [];
                        // Get keys for indexes start to start+scan_size
                        for (i = start; i < start + SCAN_SIZE; i++) {
                            addressX = this.getAddressForIndex(i, 'X');
                            addressP = this.getAddressForIndex(i, 'P');
                            addrsX.push(addressX);
                            addrsP.push(addressP);
                        }
                        return [4 /*yield*/, xChain.getUTXOs(addrsX)];
                    case 1:
                        utxoSetX = (_a.sent()).utxos;
                        return [4 /*yield*/, pChain.getUTXOs(addrsP)];
                    case 2:
                        utxoSetP = (_a.sent()).utxos;
                        // Scan UTXOs of these indexes and try to find a gap of INDEX_RANGE
                        for (i = 0; i < addrsX.length - INDEX_RANGE; i++) {
                            gapSize = 0;
                            // console.log(`Scan index: ${this.chainId} ${this.changePath}/${i+start}`);
                            for (n = 0; n < INDEX_RANGE; n++) {
                                scanIndex = i + n;
                                addr = addrsX[scanIndex];
                                addrBuf = bintools$1.parseAddress(addr, 'X');
                                addrUTXOsX = utxoSetX.getUTXOIDs([addrBuf]);
                                addrUTXOsP = utxoSetP.getUTXOIDs([addrBuf]);
                                if (addrUTXOsX.length === 0 && addrUTXOsP.length === 0) {
                                    gapSize++;
                                }
                                else {
                                    // Potential improvement
                                    i = i + n;
                                    break;
                                }
                            }
                            // If we found a gap of 20, we can return the last fullIndex+1
                            if (gapSize === INDEX_RANGE) {
                                targetIndex = start + i;
                                return [2 /*return*/, targetIndex];
                            }
                        }
                        return [4 /*yield*/, this.findAvailableIndexNode(start + SCAN_RANGE)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return HdScanner;
}());

var HDWalletAbstract = /** @class */ (function (_super) {
    __extends(HDWalletAbstract, _super);
    function HDWalletAbstract(accountKey) {
        var _this = _super.call(this) || this;
        _this.internalScan = new HdScanner(accountKey, true);
        _this.externalScan = new HdScanner(accountKey, false);
        _this.accountKey = accountKey;
        updateFilterAddresses();
        return _this;
    }
    /**
     * Returns current index used for external address derivation.
     */
    HDWalletAbstract.prototype.getExternalIndex = function () {
        return this.externalScan.getIndex();
    };
    /**
     * Returns current index used for internal address derivation.
     */
    HDWalletAbstract.prototype.getInternalIndex = function () {
        return this.internalScan.getIndex();
    };
    /**
     * Gets the active external address on the X chain
     * - The X address will change after every deposit.
     */
    HDWalletAbstract.prototype.getAddressX = function () {
        return this.externalScan.getAddressX();
    };
    /**
     * Gets the active change address on the X chain
     * - The change address will change after every transaction on the X chain.
     */
    HDWalletAbstract.prototype.getChangeAddressX = function () {
        return this.internalScan.getAddressX();
    };
    /**
     * Gets the active address on the P chain
     */
    HDWalletAbstract.prototype.getAddressP = function () {
        return this.externalScan.getAddressP();
    };
    /**
     * Returns every external X chain address used by the wallet up to now.
     */
    HDWalletAbstract.prototype.getExternalAddressesX = function () {
        return this.externalScan.getAllAddresses('X');
    };
    /**
     * Returns every internal X chain address used by the wallet up to now.
     */
    HDWalletAbstract.prototype.getInternalAddressesX = function () {
        return this.internalScan.getAllAddresses('X');
    };
    /**
     * Returns every X chain address used by the wallet up to now (internal + external).
     */
    HDWalletAbstract.prototype.getAllAddressesX = function () {
        return __spreadArray(__spreadArray([], this.getExternalAddressesX()), this.getInternalAddressesX());
    };
    HDWalletAbstract.prototype.getExternalAddressesP = function () {
        return this.externalScan.getAllAddresses('P');
    };
    /**
     * Returns every P chain address used by the wallet up to now.
     */
    HDWalletAbstract.prototype.getAllAddressesP = function () {
        return this.getExternalAddressesP();
    };
    /**
     * Scans the network and initializes internal and external addresses on P and X chains.
     * - Heavy operation
     * - MUST use the explorer api to find the last used address
     * - If explorer is not available it will use the connected node. This may result in invalid balances.
     */
    HDWalletAbstract.prototype.resetHdIndices = function (externalStart, internalStart) {
        if (externalStart === void 0) { externalStart = 0; }
        if (internalStart === void 0) { internalStart = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var indexExt, indexInt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.externalScan.resetIndex(externalStart)];
                    case 1:
                        indexExt = _a.sent();
                        return [4 /*yield*/, this.internalScan.resetIndex(internalStart)];
                    case 2:
                        indexInt = _a.sent();
                        this.emitAddressChange();
                        updateFilterAddresses();
                        return [2 /*return*/, {
                                internal: indexInt,
                                external: indexExt,
                            }];
                }
            });
        });
    };
    HDWalletAbstract.prototype.getUtxosX = function () {
        return __awaiter(this, void 0, void 0, function () {
            var utxosX, utxoAddrs, utxoAddrsStr, addrExternalX, addrInternalX, isAddrChange;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype.getUtxosX.call(this)];
                    case 1:
                        utxosX = _a.sent();
                        utxoAddrs = utxosX.getAddresses();
                        utxoAddrsStr = utxoAddrs.map(function (addr) {
                            return bintools$1.addressToString(avalanche.getHRP(), 'X', addr);
                        });
                        addrExternalX = this.getAddressX();
                        addrInternalX = this.getChangeAddressX();
                        isAddrChange = false;
                        // Increment external index if the current address is in the utxo set
                        if (utxoAddrsStr.includes(addrExternalX)) {
                            this.incrementExternal();
                            isAddrChange = true;
                        }
                        // Increment internal index if the current address is in the utxo set
                        if (utxoAddrsStr.includes(addrInternalX)) {
                            this.incrementInternal();
                            isAddrChange = true;
                        }
                        if (isAddrChange)
                            this.emitAddressChange();
                        return [2 /*return*/, utxosX];
                }
            });
        });
    };
    HDWalletAbstract.prototype.incrementExternal = function () {
        this.externalScan.increment();
        updateFilterAddresses();
    };
    HDWalletAbstract.prototype.incrementInternal = function () {
        this.internalScan.increment();
    };
    HDWalletAbstract.prototype.getUtxosP = function () {
        return __awaiter(this, void 0, void 0, function () {
            var utxosP, utxoAddrs, utxoAddrsStr, addrExternalP;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, _super.prototype.getUtxosP.call(this)];
                    case 1:
                        utxosP = _a.sent();
                        utxoAddrs = utxosP.getAddresses();
                        utxoAddrsStr = utxoAddrs.map(function (addr) {
                            return bintools$1.addressToString(avalanche.getHRP(), 'P', addr);
                        });
                        addrExternalP = this.getAddressP();
                        // Increment external index if the current address is in the utxo set
                        if (utxoAddrsStr.includes(addrExternalP)) {
                            this.incrementExternal();
                            this.emitAddressChange();
                        }
                        return [2 /*return*/, utxosP];
                }
            });
        });
    };
    return HDWalletAbstract;
}(WalletProvider));

var MnemonicWallet = /** @class */ (function (_super) {
    __extends(MnemonicWallet, _super);
    function MnemonicWallet(mnemonic) {
        var _this = this;
        var seed = bip39__namespace.mnemonicToSeedSync(mnemonic);
        var masterHdKey = HDKey__default['default'].fromMasterSeed(seed);
        var accountKey = masterHdKey.derive(AVAX_ACCOUNT_PATH);
        _this = _super.call(this, accountKey) || this;
        _this.type = 'mnemonic';
        if (!bip39__namespace.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic phrase.');
        }
        var ethAccountKey = masterHdKey.derive(ETH_ACCOUNT_PATH + '/0/0');
        _this.ethAccountKey = ethAccountKey;
        var ethKey = ethAccountKey.privateKey;
        var evmWallet = new EvmWallet(ethKey);
        _this.mnemonic = mnemonic;
        _this.evmWallet = evmWallet;
        return _this;
    }
    /**
     * Gets the active address on the C chain in Bech32 encoding
     * @return
     * Bech32 representation of the EVM address.
     */
    MnemonicWallet.prototype.getEvmAddressBech = function () {
        var keypair = new evm.KeyPair(avalanche.getHRP(), 'C');
        var addr = keypair.addressFromPublicKey(avalanche$1.Buffer.from(this.ethAccountKey.publicKey));
        return bintools$1.addressToString(avalanche.getHRP(), 'C', addr);
    };
    /**
     * Generates a 24 word mnemonic phrase and initializes a wallet instance with it.
     * @return Returns the initialized wallet.
     */
    MnemonicWallet.create = function () {
        var mnemonic = bip39__namespace.generateMnemonic(256);
        return MnemonicWallet.fromMnemonic(mnemonic);
    };
    /**
     * Returns a new 24 word mnemonic key phrase.
     */
    MnemonicWallet.generateMnemonicPhrase = function () {
        return bip39__namespace.generateMnemonic(256);
    };
    /**
     * Returns a new instance of a Mnemonic wallet from the given key phrase.
     * @param mnemonic The 24 word mnemonic phrase of the wallet
     */
    MnemonicWallet.fromMnemonic = function (mnemonic) {
        return new MnemonicWallet(mnemonic);
    };
    /**
     * Signs an EVM transaction on the C chain.
     * @param tx The unsigned transaction
     */
    MnemonicWallet.prototype.signEvm = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.evmWallet.signEVM(tx)];
            });
        });
    };
    /**
     * Signs an AVM transaction.
     * @param tx The unsigned transaction
     */
    MnemonicWallet.prototype.signX = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tx.sign(this.getKeyChainX())];
            });
        });
    };
    /**
     * Signs a PlatformVM transaction.
     * @param tx The unsigned transaction
     */
    MnemonicWallet.prototype.signP = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tx.sign(this.getKeyChainP())];
            });
        });
    };
    /**
     * Signs a C chain transaction
     * @remarks
     * Used for Import and Export transactions on the C chain. For everything else, use `this.signEvm()`
     * @param tx The unsigned transaction
     */
    MnemonicWallet.prototype.signC = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.evmWallet.signC(tx)];
            });
        });
    };
    /**
     * Returns a keychain with the keys of every derived X chain address.
     * @private
     */
    MnemonicWallet.prototype.getKeyChainX = function () {
        var internal = this.internalScan.getKeyChainX();
        var external = this.externalScan.getKeyChainX();
        return internal.union(external);
    };
    /**
     * Returns a keychain with the keys of every derived P chain address.
     * @private
     */
    MnemonicWallet.prototype.getKeyChainP = function () {
        return this.externalScan.getKeyChainP();
    };
    /**
     * Gets the active address on the C chain
     * @return
     * Hex representation of the EVM address.
     */
    MnemonicWallet.prototype.getAddressC = function () {
        return this.evmWallet.getAddress();
    };
    // TODO: Support internal address as well
    MnemonicWallet.prototype.signMessage = function (msgStr, index) {
        var key = this.externalScan.getKeyForIndexX(index);
        var digest = digestMessage(msgStr);
        // Convert to the other Buffer and sign
        var digestHex = digest.toString('hex');
        var digestBuff = avalanche$1.Buffer.from(digestHex, 'hex');
        var signed = key.sign(digestBuff);
        return bintools$1.cb58Encode(signed);
    };
    return MnemonicWallet;
}(HDWalletAbstract));

var SingletonWallet = /** @class */ (function (_super) {
    __extends(SingletonWallet, _super);
    /**
     *
     * @param privateKey An avalanche private key, starts with `PrivateKey-`
     */
    function SingletonWallet(privateKey) {
        var _this = _super.call(this) || this;
        _this.type = 'singleton';
        _this.key = '';
        _this.key = privateKey;
        // Derive EVM key and address
        var pkBuf = bintools$1.cb58Decode(privateKey.split('-')[1]);
        _this.keyBuff = pkBuf;
        var pkHex = pkBuf.toString('hex');
        var pkBuffNative = Buffer.from(pkHex, 'hex');
        _this.evmWallet = new EvmWallet(pkBuffNative);
        updateFilterAddresses();
        return _this;
    }
    // socketSubscribe(){
    //     socketX.
    // }
    SingletonWallet.fromEvmKey = function (key) {
        var keyBuff = bintools$1.cb58Encode(avalanche$1.Buffer.from(key, 'hex'));
        var avmKeyStr = "PrivateKey-" + keyBuff;
        return new SingletonWallet(avmKeyStr);
    };
    SingletonWallet.prototype.getKeyChainX = function () {
        var keyChain = xChain.newKeyChain();
        keyChain.importKey(this.key);
        return keyChain;
    };
    SingletonWallet.prototype.getKeyChainP = function () {
        var keyChain = pChain.newKeyChain();
        keyChain.importKey(this.key);
        return keyChain;
    };
    SingletonWallet.prototype.getAddressC = function () {
        return this.evmWallet.getAddress();
    };
    SingletonWallet.prototype.getAddressP = function () {
        var keyChain = this.getKeyChainP();
        return keyChain.getAddressStrings()[0];
    };
    SingletonWallet.prototype.getAddressX = function () {
        var keyChain = this.getKeyChainX();
        return keyChain.getAddressStrings()[0];
    };
    SingletonWallet.prototype.getAllAddressesP = function () {
        return [this.getAddressP()];
    };
    SingletonWallet.prototype.getAllAddressesX = function () {
        return [this.getAddressX()];
    };
    SingletonWallet.prototype.getChangeAddressX = function () {
        return this.getAddressX();
    };
    SingletonWallet.prototype.getEvmAddressBech = function () {
        var keypair = new evm.KeyPair(avalanche.getHRP(), 'C');
        keypair.importKey(this.keyBuff);
        return keypair.getAddressString();
    };
    SingletonWallet.prototype.getExternalAddressesP = function () {
        return [this.getAddressP()];
    };
    SingletonWallet.prototype.getExternalAddressesX = function () {
        return [this.getAddressX()];
    };
    SingletonWallet.prototype.getInternalAddressesX = function () {
        return [this.getAddressX()];
    };
    SingletonWallet.prototype.signC = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.evmWallet.signC(tx)];
            });
        });
    };
    SingletonWallet.prototype.signEvm = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.evmWallet.signEVM(tx)];
            });
        });
    };
    SingletonWallet.prototype.signP = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tx.sign(this.getKeyChainP())];
            });
        });
    };
    SingletonWallet.prototype.signX = function (tx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, tx.sign(this.getKeyChainX())];
            });
        });
    };
    return SingletonWallet;
}(WalletProvider));

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var utils = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defer = defer;
exports.splitPath = splitPath;
exports.eachSeries = eachSeries;
exports.foreach = foreach;
exports.doIf = doIf;
exports.asyncWhile = asyncWhile;

/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
function defer() {
  let resolve, reject;
  let promise = new Promise(function (success, failure) {
    resolve = success;
    reject = failure;
  });
  if (!resolve || !reject) throw "defer() error"; // this never happens and is just to make flow happy

  return {
    promise,
    resolve,
    reject
  };
} // TODO use bip32-path library


function splitPath(path) {
  let result = [];
  let components = path.split("/");
  components.forEach(element => {
    let number = parseInt(element, 10);

    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }

    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }

    result.push(number);
  });
  return result;
} // TODO use async await


function eachSeries(arr, fun) {
  return arr.reduce((p, e) => p.then(() => fun(e)), Promise.resolve());
}

function foreach(arr, callback) {
  function iterate(index, array, result) {
    if (index >= array.length) {
      return result;
    } else return callback(array[index], index).then(function (res) {
      result.push(res);
      return iterate(index + 1, array, result);
    });
  }

  return Promise.resolve().then(() => iterate(0, arr, []));
}

function doIf(condition, callback) {
  return Promise.resolve().then(() => {
    if (condition) {
      return callback();
    }
  });
}

function asyncWhile(predicate, callback) {
  function iterate(result) {
    if (!predicate()) {
      return result;
    } else {
      return callback().then(res => {
        result.push(res);
        return iterate(result);
      });
    }
  }

  return Promise.resolve([]).then(iterate);
}
//# sourceMappingURL=utils.js.map
});

unwrapExports(utils);
utils.defer;
utils.splitPath;
utils.eachSeries;
utils.foreach;
utils.doIf;
utils.asyncWhile;

var index_cjs = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

/* eslint-disable no-continue */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */
var errorClasses = {};
var deserializers = {};
var addCustomErrorDeserializer = function (name, deserializer) {
    deserializers[name] = deserializer;
};
var createCustomErrorClass = function (name) {
    var C = function CustomError(message, fields) {
        Object.assign(this, fields);
        this.name = name;
        this.message = message || name;
        this.stack = new Error().stack;
    };
    C.prototype = new Error();
    errorClasses[name] = C;
    return C;
};
// inspired from https://github.com/programble/errio/blob/master/index.js
var deserializeError = function (object) {
    if (typeof object === "object" && object) {
        try {
            // $FlowFixMe FIXME HACK
            var msg = JSON.parse(object.message);
            if (msg.message && msg.name) {
                object = msg;
            }
        }
        catch (e) {
            // nothing
        }
        var error = void 0;
        if (typeof object.name === "string") {
            var name_1 = object.name;
            var des = deserializers[name_1];
            if (des) {
                error = des(object);
            }
            else {
                var constructor = name_1 === "Error" ? Error : errorClasses[name_1];
                if (!constructor) {
                    console.warn("deserializing an unknown class '" + name_1 + "'");
                    constructor = createCustomErrorClass(name_1);
                }
                error = Object.create(constructor.prototype);
                try {
                    for (var prop in object) {
                        if (object.hasOwnProperty(prop)) {
                            error[prop] = object[prop];
                        }
                    }
                }
                catch (e) {
                    // sometimes setting a property can fail (e.g. .name)
                }
            }
        }
        else {
            error = new Error(object.message);
        }
        if (!error.stack && Error.captureStackTrace) {
            Error.captureStackTrace(error, deserializeError);
        }
        return error;
    }
    return new Error(String(object));
};
// inspired from https://github.com/sindresorhus/serialize-error/blob/master/index.js
var serializeError = function (value) {
    if (!value)
        return value;
    if (typeof value === "object") {
        return destroyCircular(value, []);
    }
    if (typeof value === "function") {
        return "[Function: " + (value.name || "anonymous") + "]";
    }
    return value;
};
// https://www.npmjs.com/package/destroy-circular
function destroyCircular(from, seen) {
    var to = {};
    seen.push(from);
    for (var _i = 0, _a = Object.keys(from); _i < _a.length; _i++) {
        var key = _a[_i];
        var value = from[key];
        if (typeof value === "function") {
            continue;
        }
        if (!value || typeof value !== "object") {
            to[key] = value;
            continue;
        }
        if (seen.indexOf(from[key]) === -1) {
            to[key] = destroyCircular(from[key], seen.slice(0));
            continue;
        }
        to[key] = "[Circular]";
    }
    if (typeof from.name === "string") {
        to.name = from.name;
    }
    if (typeof from.message === "string") {
        to.message = from.message;
    }
    if (typeof from.stack === "string") {
        to.stack = from.stack;
    }
    return to;
}

var AccountNameRequiredError = createCustomErrorClass("AccountNameRequired");
var AccountNotSupported = createCustomErrorClass("AccountNotSupported");
var AmountRequired = createCustomErrorClass("AmountRequired");
var BluetoothRequired = createCustomErrorClass("BluetoothRequired");
var BtcUnmatchedApp = createCustomErrorClass("BtcUnmatchedApp");
var CantOpenDevice = createCustomErrorClass("CantOpenDevice");
var CashAddrNotSupported = createCustomErrorClass("CashAddrNotSupported");
var CurrencyNotSupported = createCustomErrorClass("CurrencyNotSupported");
var DeviceAppVerifyNotSupported = createCustomErrorClass("DeviceAppVerifyNotSupported");
var DeviceGenuineSocketEarlyClose = createCustomErrorClass("DeviceGenuineSocketEarlyClose");
var DeviceNotGenuineError = createCustomErrorClass("DeviceNotGenuine");
var DeviceOnDashboardExpected = createCustomErrorClass("DeviceOnDashboardExpected");
var DeviceOnDashboardUnexpected = createCustomErrorClass("DeviceOnDashboardUnexpected");
var DeviceInOSUExpected = createCustomErrorClass("DeviceInOSUExpected");
var DeviceHalted = createCustomErrorClass("DeviceHalted");
var DeviceNameInvalid = createCustomErrorClass("DeviceNameInvalid");
var DeviceSocketFail = createCustomErrorClass("DeviceSocketFail");
var DeviceSocketNoBulkStatus = createCustomErrorClass("DeviceSocketNoBulkStatus");
var DisconnectedDevice = createCustomErrorClass("DisconnectedDevice");
var DisconnectedDeviceDuringOperation = createCustomErrorClass("DisconnectedDeviceDuringOperation");
var EnpointConfigError = createCustomErrorClass("EnpointConfig");
var EthAppPleaseEnableContractData = createCustomErrorClass("EthAppPleaseEnableContractData");
var FeeEstimationFailed = createCustomErrorClass("FeeEstimationFailed");
var FirmwareNotRecognized = createCustomErrorClass("FirmwareNotRecognized");
var HardResetFail = createCustomErrorClass("HardResetFail");
var InvalidXRPTag = createCustomErrorClass("InvalidXRPTag");
var InvalidAddress = createCustomErrorClass("InvalidAddress");
var InvalidAddressBecauseDestinationIsAlsoSource = createCustomErrorClass("InvalidAddressBecauseDestinationIsAlsoSource");
var LatestMCUInstalledError = createCustomErrorClass("LatestMCUInstalledError");
var UnknownMCU = createCustomErrorClass("UnknownMCU");
var LedgerAPIError = createCustomErrorClass("LedgerAPIError");
var LedgerAPIErrorWithMessage = createCustomErrorClass("LedgerAPIErrorWithMessage");
var LedgerAPINotAvailable = createCustomErrorClass("LedgerAPINotAvailable");
var ManagerAppAlreadyInstalledError = createCustomErrorClass("ManagerAppAlreadyInstalled");
var ManagerAppRelyOnBTCError = createCustomErrorClass("ManagerAppRelyOnBTC");
var ManagerAppDepInstallRequired = createCustomErrorClass("ManagerAppDepInstallRequired");
var ManagerAppDepUninstallRequired = createCustomErrorClass("ManagerAppDepUninstallRequired");
var ManagerDeviceLockedError = createCustomErrorClass("ManagerDeviceLocked");
var ManagerFirmwareNotEnoughSpaceError = createCustomErrorClass("ManagerFirmwareNotEnoughSpace");
var ManagerNotEnoughSpaceError = createCustomErrorClass("ManagerNotEnoughSpace");
var ManagerUninstallBTCDep = createCustomErrorClass("ManagerUninstallBTCDep");
var NetworkDown = createCustomErrorClass("NetworkDown");
var NoAddressesFound = createCustomErrorClass("NoAddressesFound");
var NotEnoughBalance = createCustomErrorClass("NotEnoughBalance");
var NotEnoughBalanceToDelegate = createCustomErrorClass("NotEnoughBalanceToDelegate");
var NotEnoughBalanceInParentAccount = createCustomErrorClass("NotEnoughBalanceInParentAccount");
var NotEnoughSpendableBalance = createCustomErrorClass("NotEnoughSpendableBalance");
var NotEnoughBalanceBecauseDestinationNotCreated = createCustomErrorClass("NotEnoughBalanceBecauseDestinationNotCreated");
var NoAccessToCamera = createCustomErrorClass("NoAccessToCamera");
var NotEnoughGas = createCustomErrorClass("NotEnoughGas");
var NotSupportedLegacyAddress = createCustomErrorClass("NotSupportedLegacyAddress");
var GasLessThanEstimate = createCustomErrorClass("GasLessThanEstimate");
var PasswordsDontMatchError = createCustomErrorClass("PasswordsDontMatch");
var PasswordIncorrectError = createCustomErrorClass("PasswordIncorrect");
var RecommendSubAccountsToEmpty = createCustomErrorClass("RecommendSubAccountsToEmpty");
var RecommendUndelegation = createCustomErrorClass("RecommendUndelegation");
var TimeoutTagged = createCustomErrorClass("TimeoutTagged");
var UnexpectedBootloader = createCustomErrorClass("UnexpectedBootloader");
var MCUNotGenuineToDashboard = createCustomErrorClass("MCUNotGenuineToDashboard");
var RecipientRequired = createCustomErrorClass("RecipientRequired");
var UnavailableTezosOriginatedAccountReceive = createCustomErrorClass("UnavailableTezosOriginatedAccountReceive");
var UnavailableTezosOriginatedAccountSend = createCustomErrorClass("UnavailableTezosOriginatedAccountSend");
var UpdateFetchFileFail = createCustomErrorClass("UpdateFetchFileFail");
var UpdateIncorrectHash = createCustomErrorClass("UpdateIncorrectHash");
var UpdateIncorrectSig = createCustomErrorClass("UpdateIncorrectSig");
var UpdateYourApp = createCustomErrorClass("UpdateYourApp");
var UserRefusedDeviceNameChange = createCustomErrorClass("UserRefusedDeviceNameChange");
var UserRefusedAddress = createCustomErrorClass("UserRefusedAddress");
var UserRefusedFirmwareUpdate = createCustomErrorClass("UserRefusedFirmwareUpdate");
var UserRefusedAllowManager = createCustomErrorClass("UserRefusedAllowManager");
var UserRefusedOnDevice = createCustomErrorClass("UserRefusedOnDevice"); // TODO rename because it's just for transaction refusal
var TransportOpenUserCancelled = createCustomErrorClass("TransportOpenUserCancelled");
var TransportInterfaceNotAvailable = createCustomErrorClass("TransportInterfaceNotAvailable");
var TransportRaceCondition = createCustomErrorClass("TransportRaceCondition");
var TransportWebUSBGestureRequired = createCustomErrorClass("TransportWebUSBGestureRequired");
var DeviceShouldStayInApp = createCustomErrorClass("DeviceShouldStayInApp");
var WebsocketConnectionError = createCustomErrorClass("WebsocketConnectionError");
var WebsocketConnectionFailed = createCustomErrorClass("WebsocketConnectionFailed");
var WrongDeviceForAccount = createCustomErrorClass("WrongDeviceForAccount");
var WrongAppForCurrency = createCustomErrorClass("WrongAppForCurrency");
var ETHAddressNonEIP = createCustomErrorClass("ETHAddressNonEIP");
var CantScanQRCode = createCustomErrorClass("CantScanQRCode");
var FeeNotLoaded = createCustomErrorClass("FeeNotLoaded");
var FeeRequired = createCustomErrorClass("FeeRequired");
var FeeTooHigh = createCustomErrorClass("FeeTooHigh");
var SyncError = createCustomErrorClass("SyncError");
var PairingFailed = createCustomErrorClass("PairingFailed");
var GenuineCheckFailed = createCustomErrorClass("GenuineCheckFailed");
var LedgerAPI4xx = createCustomErrorClass("LedgerAPI4xx");
var LedgerAPI5xx = createCustomErrorClass("LedgerAPI5xx");
var FirmwareOrAppUpdateRequired = createCustomErrorClass("FirmwareOrAppUpdateRequired");
// db stuff, no need to translate
var NoDBPathGiven = createCustomErrorClass("NoDBPathGiven");
var DBWrongPassword = createCustomErrorClass("DBWrongPassword");
var DBNotReset = createCustomErrorClass("DBNotReset");
/**
 * TransportError is used for any generic transport errors.
 * e.g. Error thrown when data received by exchanges are incorrect or if exchanged failed to communicate with the device for various reason.
 */
function TransportError(message, id) {
    this.name = "TransportError";
    this.message = message;
    this.stack = new Error().stack;
    this.id = id;
}
TransportError.prototype = new Error();
addCustomErrorDeserializer("TransportError", function (e) { return new TransportError(e.message, e.id); });
var StatusCodes = {
    PIN_REMAINING_ATTEMPTS: 0x63c0,
    INCORRECT_LENGTH: 0x6700,
    MISSING_CRITICAL_PARAMETER: 0x6800,
    COMMAND_INCOMPATIBLE_FILE_STRUCTURE: 0x6981,
    SECURITY_STATUS_NOT_SATISFIED: 0x6982,
    CONDITIONS_OF_USE_NOT_SATISFIED: 0x6985,
    INCORRECT_DATA: 0x6a80,
    NOT_ENOUGH_MEMORY_SPACE: 0x6a84,
    REFERENCED_DATA_NOT_FOUND: 0x6a88,
    FILE_ALREADY_EXISTS: 0x6a89,
    INCORRECT_P1_P2: 0x6b00,
    INS_NOT_SUPPORTED: 0x6d00,
    CLA_NOT_SUPPORTED: 0x6e00,
    TECHNICAL_PROBLEM: 0x6f00,
    OK: 0x9000,
    MEMORY_PROBLEM: 0x9240,
    NO_EF_SELECTED: 0x9400,
    INVALID_OFFSET: 0x9402,
    FILE_NOT_FOUND: 0x9404,
    INCONSISTENT_FILE: 0x9408,
    ALGORITHM_NOT_SUPPORTED: 0x9484,
    INVALID_KCV: 0x9485,
    CODE_NOT_INITIALIZED: 0x9802,
    ACCESS_CONDITION_NOT_FULFILLED: 0x9804,
    CONTRADICTION_SECRET_CODE_STATUS: 0x9808,
    CONTRADICTION_INVALIDATION: 0x9810,
    CODE_BLOCKED: 0x9840,
    MAX_VALUE_REACHED: 0x9850,
    GP_AUTH_FAILED: 0x6300,
    LICENSING: 0x6f42,
    HALTED: 0x6faa,
};
function getAltStatusMessage(code) {
    switch (code) {
        // improve text of most common errors
        case 0x6700:
            return "Incorrect length";
        case 0x6800:
            return "Missing critical parameter";
        case 0x6982:
            return "Security not satisfied (dongle locked or have invalid access rights)";
        case 0x6985:
            return "Condition of use not satisfied (denied by the user?)";
        case 0x6a80:
            return "Invalid data received";
        case 0x6b00:
            return "Invalid parameter received";
    }
    if (0x6f00 <= code && code <= 0x6fff) {
        return "Internal error, please report";
    }
}
/**
 * Error thrown when a device returned a non success status.
 * the error.statusCode is one of the `StatusCodes` exported by this library.
 */
function TransportStatusError(statusCode) {
    this.name = "TransportStatusError";
    var statusText = Object.keys(StatusCodes).find(function (k) { return StatusCodes[k] === statusCode; }) ||
        "UNKNOWN_ERROR";
    var smsg = getAltStatusMessage(statusCode) || statusText;
    var statusCodeStr = statusCode.toString(16);
    this.message = "Ledger device: " + smsg + " (0x" + statusCodeStr + ")";
    this.stack = new Error().stack;
    this.statusCode = statusCode;
    this.statusText = statusText;
}
TransportStatusError.prototype = new Error();
addCustomErrorDeserializer("TransportStatusError", function (e) { return new TransportStatusError(e.statusCode); });

exports.AccountNameRequiredError = AccountNameRequiredError;
exports.AccountNotSupported = AccountNotSupported;
exports.AmountRequired = AmountRequired;
exports.BluetoothRequired = BluetoothRequired;
exports.BtcUnmatchedApp = BtcUnmatchedApp;
exports.CantOpenDevice = CantOpenDevice;
exports.CantScanQRCode = CantScanQRCode;
exports.CashAddrNotSupported = CashAddrNotSupported;
exports.CurrencyNotSupported = CurrencyNotSupported;
exports.DBNotReset = DBNotReset;
exports.DBWrongPassword = DBWrongPassword;
exports.DeviceAppVerifyNotSupported = DeviceAppVerifyNotSupported;
exports.DeviceGenuineSocketEarlyClose = DeviceGenuineSocketEarlyClose;
exports.DeviceHalted = DeviceHalted;
exports.DeviceInOSUExpected = DeviceInOSUExpected;
exports.DeviceNameInvalid = DeviceNameInvalid;
exports.DeviceNotGenuineError = DeviceNotGenuineError;
exports.DeviceOnDashboardExpected = DeviceOnDashboardExpected;
exports.DeviceOnDashboardUnexpected = DeviceOnDashboardUnexpected;
exports.DeviceShouldStayInApp = DeviceShouldStayInApp;
exports.DeviceSocketFail = DeviceSocketFail;
exports.DeviceSocketNoBulkStatus = DeviceSocketNoBulkStatus;
exports.DisconnectedDevice = DisconnectedDevice;
exports.DisconnectedDeviceDuringOperation = DisconnectedDeviceDuringOperation;
exports.ETHAddressNonEIP = ETHAddressNonEIP;
exports.EnpointConfigError = EnpointConfigError;
exports.EthAppPleaseEnableContractData = EthAppPleaseEnableContractData;
exports.FeeEstimationFailed = FeeEstimationFailed;
exports.FeeNotLoaded = FeeNotLoaded;
exports.FeeRequired = FeeRequired;
exports.FeeTooHigh = FeeTooHigh;
exports.FirmwareNotRecognized = FirmwareNotRecognized;
exports.FirmwareOrAppUpdateRequired = FirmwareOrAppUpdateRequired;
exports.GasLessThanEstimate = GasLessThanEstimate;
exports.GenuineCheckFailed = GenuineCheckFailed;
exports.HardResetFail = HardResetFail;
exports.InvalidAddress = InvalidAddress;
exports.InvalidAddressBecauseDestinationIsAlsoSource = InvalidAddressBecauseDestinationIsAlsoSource;
exports.InvalidXRPTag = InvalidXRPTag;
exports.LatestMCUInstalledError = LatestMCUInstalledError;
exports.LedgerAPI4xx = LedgerAPI4xx;
exports.LedgerAPI5xx = LedgerAPI5xx;
exports.LedgerAPIError = LedgerAPIError;
exports.LedgerAPIErrorWithMessage = LedgerAPIErrorWithMessage;
exports.LedgerAPINotAvailable = LedgerAPINotAvailable;
exports.MCUNotGenuineToDashboard = MCUNotGenuineToDashboard;
exports.ManagerAppAlreadyInstalledError = ManagerAppAlreadyInstalledError;
exports.ManagerAppDepInstallRequired = ManagerAppDepInstallRequired;
exports.ManagerAppDepUninstallRequired = ManagerAppDepUninstallRequired;
exports.ManagerAppRelyOnBTCError = ManagerAppRelyOnBTCError;
exports.ManagerDeviceLockedError = ManagerDeviceLockedError;
exports.ManagerFirmwareNotEnoughSpaceError = ManagerFirmwareNotEnoughSpaceError;
exports.ManagerNotEnoughSpaceError = ManagerNotEnoughSpaceError;
exports.ManagerUninstallBTCDep = ManagerUninstallBTCDep;
exports.NetworkDown = NetworkDown;
exports.NoAccessToCamera = NoAccessToCamera;
exports.NoAddressesFound = NoAddressesFound;
exports.NoDBPathGiven = NoDBPathGiven;
exports.NotEnoughBalance = NotEnoughBalance;
exports.NotEnoughBalanceBecauseDestinationNotCreated = NotEnoughBalanceBecauseDestinationNotCreated;
exports.NotEnoughBalanceInParentAccount = NotEnoughBalanceInParentAccount;
exports.NotEnoughBalanceToDelegate = NotEnoughBalanceToDelegate;
exports.NotEnoughGas = NotEnoughGas;
exports.NotEnoughSpendableBalance = NotEnoughSpendableBalance;
exports.NotSupportedLegacyAddress = NotSupportedLegacyAddress;
exports.PairingFailed = PairingFailed;
exports.PasswordIncorrectError = PasswordIncorrectError;
exports.PasswordsDontMatchError = PasswordsDontMatchError;
exports.RecipientRequired = RecipientRequired;
exports.RecommendSubAccountsToEmpty = RecommendSubAccountsToEmpty;
exports.RecommendUndelegation = RecommendUndelegation;
exports.StatusCodes = StatusCodes;
exports.SyncError = SyncError;
exports.TimeoutTagged = TimeoutTagged;
exports.TransportError = TransportError;
exports.TransportInterfaceNotAvailable = TransportInterfaceNotAvailable;
exports.TransportOpenUserCancelled = TransportOpenUserCancelled;
exports.TransportRaceCondition = TransportRaceCondition;
exports.TransportStatusError = TransportStatusError;
exports.TransportWebUSBGestureRequired = TransportWebUSBGestureRequired;
exports.UnavailableTezosOriginatedAccountReceive = UnavailableTezosOriginatedAccountReceive;
exports.UnavailableTezosOriginatedAccountSend = UnavailableTezosOriginatedAccountSend;
exports.UnexpectedBootloader = UnexpectedBootloader;
exports.UnknownMCU = UnknownMCU;
exports.UpdateFetchFileFail = UpdateFetchFileFail;
exports.UpdateIncorrectHash = UpdateIncorrectHash;
exports.UpdateIncorrectSig = UpdateIncorrectSig;
exports.UpdateYourApp = UpdateYourApp;
exports.UserRefusedAddress = UserRefusedAddress;
exports.UserRefusedAllowManager = UserRefusedAllowManager;
exports.UserRefusedDeviceNameChange = UserRefusedDeviceNameChange;
exports.UserRefusedFirmwareUpdate = UserRefusedFirmwareUpdate;
exports.UserRefusedOnDevice = UserRefusedOnDevice;
exports.WebsocketConnectionError = WebsocketConnectionError;
exports.WebsocketConnectionFailed = WebsocketConnectionFailed;
exports.WrongAppForCurrency = WrongAppForCurrency;
exports.WrongDeviceForAccount = WrongDeviceForAccount;
exports.addCustomErrorDeserializer = addCustomErrorDeserializer;
exports.createCustomErrorClass = createCustomErrorClass;
exports.deserializeError = deserializeError;
exports.getAltStatusMessage = getAltStatusMessage;
exports.serializeError = serializeError;
});

unwrapExports(index_cjs);
index_cjs.AccountNameRequiredError;
index_cjs.AccountNotSupported;
index_cjs.AmountRequired;
index_cjs.BluetoothRequired;
index_cjs.BtcUnmatchedApp;
index_cjs.CantOpenDevice;
index_cjs.CantScanQRCode;
index_cjs.CashAddrNotSupported;
index_cjs.CurrencyNotSupported;
index_cjs.DBNotReset;
index_cjs.DBWrongPassword;
index_cjs.DeviceAppVerifyNotSupported;
index_cjs.DeviceGenuineSocketEarlyClose;
index_cjs.DeviceHalted;
index_cjs.DeviceInOSUExpected;
index_cjs.DeviceNameInvalid;
index_cjs.DeviceNotGenuineError;
index_cjs.DeviceOnDashboardExpected;
index_cjs.DeviceOnDashboardUnexpected;
index_cjs.DeviceShouldStayInApp;
index_cjs.DeviceSocketFail;
index_cjs.DeviceSocketNoBulkStatus;
index_cjs.DisconnectedDevice;
index_cjs.DisconnectedDeviceDuringOperation;
index_cjs.ETHAddressNonEIP;
index_cjs.EnpointConfigError;
index_cjs.EthAppPleaseEnableContractData;
index_cjs.FeeEstimationFailed;
index_cjs.FeeNotLoaded;
index_cjs.FeeRequired;
index_cjs.FeeTooHigh;
index_cjs.FirmwareNotRecognized;
index_cjs.FirmwareOrAppUpdateRequired;
index_cjs.GasLessThanEstimate;
index_cjs.GenuineCheckFailed;
index_cjs.HardResetFail;
index_cjs.InvalidAddress;
index_cjs.InvalidAddressBecauseDestinationIsAlsoSource;
index_cjs.InvalidXRPTag;
index_cjs.LatestMCUInstalledError;
index_cjs.LedgerAPI4xx;
index_cjs.LedgerAPI5xx;
index_cjs.LedgerAPIError;
index_cjs.LedgerAPIErrorWithMessage;
index_cjs.LedgerAPINotAvailable;
index_cjs.MCUNotGenuineToDashboard;
index_cjs.ManagerAppAlreadyInstalledError;
index_cjs.ManagerAppDepInstallRequired;
index_cjs.ManagerAppDepUninstallRequired;
index_cjs.ManagerAppRelyOnBTCError;
index_cjs.ManagerDeviceLockedError;
index_cjs.ManagerFirmwareNotEnoughSpaceError;
index_cjs.ManagerNotEnoughSpaceError;
index_cjs.ManagerUninstallBTCDep;
index_cjs.NetworkDown;
index_cjs.NoAccessToCamera;
index_cjs.NoAddressesFound;
index_cjs.NoDBPathGiven;
index_cjs.NotEnoughBalance;
index_cjs.NotEnoughBalanceBecauseDestinationNotCreated;
index_cjs.NotEnoughBalanceInParentAccount;
index_cjs.NotEnoughBalanceToDelegate;
index_cjs.NotEnoughGas;
index_cjs.NotEnoughSpendableBalance;
index_cjs.NotSupportedLegacyAddress;
index_cjs.PairingFailed;
index_cjs.PasswordIncorrectError;
index_cjs.PasswordsDontMatchError;
index_cjs.RecipientRequired;
index_cjs.RecommendSubAccountsToEmpty;
index_cjs.RecommendUndelegation;
index_cjs.StatusCodes;
index_cjs.SyncError;
index_cjs.TimeoutTagged;
index_cjs.TransportError;
index_cjs.TransportInterfaceNotAvailable;
index_cjs.TransportOpenUserCancelled;
index_cjs.TransportRaceCondition;
index_cjs.TransportStatusError;
index_cjs.TransportWebUSBGestureRequired;
index_cjs.UnavailableTezosOriginatedAccountReceive;
index_cjs.UnavailableTezosOriginatedAccountSend;
index_cjs.UnexpectedBootloader;
index_cjs.UnknownMCU;
index_cjs.UpdateFetchFileFail;
index_cjs.UpdateIncorrectHash;
index_cjs.UpdateIncorrectSig;
index_cjs.UpdateYourApp;
index_cjs.UserRefusedAddress;
index_cjs.UserRefusedAllowManager;
index_cjs.UserRefusedDeviceNameChange;
index_cjs.UserRefusedFirmwareUpdate;
index_cjs.UserRefusedOnDevice;
index_cjs.WebsocketConnectionError;
index_cjs.WebsocketConnectionFailed;
index_cjs.WrongAppForCurrency;
index_cjs.WrongDeviceForAccount;
index_cjs.addCustomErrorDeserializer;
index_cjs.createCustomErrorClass;
index_cjs.deserializeError;
index_cjs.getAltStatusMessage;
index_cjs.serializeError;

var Eth_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;









/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
// FIXME drop:
const starkQuantizationTypeMap = {
  eth: 1,
  erc20: 2,
  erc721: 3,
  erc20mintable: 4,
  erc721mintable: 5
};

function hexBuffer(str) {
  return Buffer.from(str.startsWith("0x") ? str.slice(2) : str, "hex");
}

function maybeHexBuffer(str) {
  if (!str) return null;
  return hexBuffer(str);
}

const remapTransactionRelatedErrors = e => {
  if (e && e.statusCode === 0x6a80) {
    return new index_cjs.EthAppPleaseEnableContractData("Please enable Contract data on the Ethereum app Settings");
  }

  return e;
};
/**
 * Ethereum API
 *
 * @example
 * import Eth from "@ledgerhq/hw-app-eth";
 * const eth = new Eth(transport)
 */


class Eth {
  constructor(transport, scrambleKey = "w0w") {
    this.transport = void 0;
    this.transport = transport;
    transport.decorateAppAPIMethods(this, ["getAddress", "provideERC20TokenInformation", "signTransaction", "signPersonalMessage", "getAppConfiguration", "signEIP712HashedMessage", "starkGetPublicKey", "starkSignOrder", "starkSignOrder_v2", "starkSignTransfer", "starkSignTransfer_v2", "starkProvideQuantum", "starkProvideQuantum_v2", "starkUnsafeSign", "eth2GetPublicKey", "eth2SetWithdrawalIndex"], scrambleKey);
  }
  /**
   * get Ethereum address for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @option boolChaincode optionally enable or not the chaincode request
   * @return an object with a publicKey, address and (optionally) chainCode
   * @example
   * eth.getAddress("44'/60'/0'/0/0").then(o => o.address)
   */


  getAddress(path, boolDisplay, boolChaincode) {
    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport.send(0xe0, 0x02, boolDisplay ? 0x01 : 0x00, boolChaincode ? 0x01 : 0x00, buffer).then(response => {
      let result = {};
      let publicKeyLength = response[0];
      let addressLength = response[1 + publicKeyLength];
      result.publicKey = response.slice(1, 1 + publicKeyLength).toString("hex");
      result.address = "0x" + response.slice(1 + publicKeyLength + 1, 1 + publicKeyLength + 1 + addressLength).toString("ascii");

      if (boolChaincode) {
        result.chainCode = response.slice(1 + publicKeyLength + 1 + addressLength, 1 + publicKeyLength + 1 + addressLength + 32).toString("hex");
      }

      return result;
    });
  }
  /**
   * This commands provides a trusted description of an ERC 20 token
   * to associate a contract address with a ticker and number of decimals.
   *
   * It shall be run immediately before performing a transaction involving a contract
   * calling this contract address to display the proper token information to the user if necessary.
   *
   * @param {*} info: a blob from "erc20.js" utilities that contains all token information.
   *
   * @example
   * import { byContractAddress } from "@ledgerhq/hw-app-eth/erc20"
   * const zrxInfo = byContractAddress("0xe41d2489571d322189246dafa5ebde1f4699f498")
   * if (zrxInfo) await appEth.provideERC20TokenInformation(zrxInfo)
   * const signed = await appEth.signTransaction(path, rawTxHex)
   */


  provideERC20TokenInformation({
    data
  }) {
    return this.transport.send(0xe0, 0x0a, 0x00, 0x00, data).then(() => true, e => {
      if (e && e.statusCode === 0x6d00) {
        // this case happen for older version of ETH app, since older app version had the ERC20 data hardcoded, it's fine to assume it worked.
        // we return a flag to know if the call was effective or not
        return false;
      }

      throw e;
    });
  }
  /**
   * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign
   * @example
   eth.signTransaction("44'/60'/0'/0/0", "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080").then(result => ...)
   */


  signTransaction(path, rawTxHex) {
    let paths = (0, utils.splitPath)(path);
    let offset = 0;
    let rawTx = Buffer.from(rawTxHex, "hex");
    let toSend = [];
    let response; // Check if the TX is encoded following EIP 155

    let rlpTx = (0, rlp__default['default'].decode)(rawTx);
    let rlpOffset = 0;
    let chainIdPrefix = "";

    if (rlpTx.length > 6) {
      let rlpVrs = (0, rlp__default['default'].encode)(rlpTx.slice(-3));
      rlpOffset = rawTx.length - (rlpVrs.length - 1);
      const chainIdSrc = rlpTx[6];
      const chainIdBuf = Buffer.alloc(4);
      chainIdSrc.copy(chainIdBuf, 4 - chainIdSrc.length);
      chainIdPrefix = (chainIdBuf.readUInt32BE(0) * 2).toString(16).slice(0, -2); // Drop the low byte, that comes from the ledger.
    }

    while (offset !== rawTx.length) {
      let maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 : 150;
      let chunkSize = offset + maxChunkSize > rawTx.length ? rawTx.length - offset : maxChunkSize;

      if (rlpOffset != 0 && offset + chunkSize == rlpOffset) {
        // Make sure that the chunk doesn't end right on the EIP 155 marker if set
        chunkSize--;
      }

      let buffer = Buffer.alloc(offset === 0 ? 1 + paths.length * 4 + chunkSize : chunkSize);

      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        rawTx.copy(buffer, 1 + 4 * paths.length, offset, offset + chunkSize);
      } else {
        rawTx.copy(buffer, 0, offset, offset + chunkSize);
      }

      toSend.push(buffer);
      offset += chunkSize;
    }

    return (0, utils.foreach)(toSend, (data, i) => this.transport.send(0xe0, 0x04, i === 0 ? 0x00 : 0x80, 0x00, data).then(apduResponse => {
      response = apduResponse;
    })).then(() => {
      const v = chainIdPrefix + response.slice(0, 1).toString("hex");
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        v,
        r,
        s
      };
    }, e => {
      throw remapTransactionRelatedErrors(e);
    });
  }
  /**
   */


  getAppConfiguration() {
    return this.transport.send(0xe0, 0x06, 0x00, 0x00).then(response => {
      let result = {};
      result.arbitraryDataEnabled = response[0] & 0x01;
      result.erc20ProvisioningNecessary = response[0] & 0x02;
      result.starkEnabled = response[0] & 0x04;
      result.starkv2Supported = response[0] & 0x08;
      result.version = "" + response[1] + "." + response[2] + "." + response[3];
      return result;
    });
  }
  /**
  * You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
  * @example
  eth.signPersonalMessage("44'/60'/0'/0/0", Buffer.from("test").toString("hex")).then(result => {
  var v = result['v'] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  console.log("Signature 0x" + result['r'] + result['s'] + v);
  })
   */


  signPersonalMessage(path, messageHex) {
    let paths = (0, utils.splitPath)(path);
    let offset = 0;
    let message = Buffer.from(messageHex, "hex");
    let toSend = [];
    let response;

    while (offset !== message.length) {
      let maxChunkSize = offset === 0 ? 150 - 1 - paths.length * 4 - 4 : 150;
      let chunkSize = offset + maxChunkSize > message.length ? message.length - offset : maxChunkSize;
      let buffer = Buffer.alloc(offset === 0 ? 1 + paths.length * 4 + 4 + chunkSize : chunkSize);

      if (offset === 0) {
        buffer[0] = paths.length;
        paths.forEach((element, index) => {
          buffer.writeUInt32BE(element, 1 + 4 * index);
        });
        buffer.writeUInt32BE(message.length, 1 + 4 * paths.length);
        message.copy(buffer, 1 + 4 * paths.length + 4, offset, offset + chunkSize);
      } else {
        message.copy(buffer, 0, offset, offset + chunkSize);
      }

      toSend.push(buffer);
      offset += chunkSize;
    }

    return (0, utils.foreach)(toSend, (data, i) => this.transport.send(0xe0, 0x08, i === 0 ? 0x00 : 0x80, 0x00, data).then(apduResponse => {
      response = apduResponse;
    })).then(() => {
      const v = response[0];
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        v,
        r,
        s
      };
    });
  }
  /**
  * Sign a prepared message following web3.eth.signTypedData specification. The host computes the domain separator and hashStruct(message)
  * @example
  eth.signEIP712HashedMessage("44'/60'/0'/0/0", Buffer.from("0101010101010101010101010101010101010101010101010101010101010101").toString("hex"), Buffer.from("0202020202020202020202020202020202020202020202020202020202020202").toString("hex")).then(result => {
  var v = result['v'] - 27;
  v = v.toString(16);
  if (v.length < 2) {
    v = "0" + v;
  }
  console.log("Signature 0x" + result['r'] + result['s'] + v);
  })
   */


  signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex) {
    const domainSeparator = hexBuffer(domainSeparatorHex);
    const hashStruct = hexBuffer(hashStructMessageHex);
    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4 + 32 + 32, 0);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    domainSeparator.copy(buffer, offset);
    offset += 32;
    hashStruct.copy(buffer, offset);
    return this.transport.send(0xe0, 0x0c, 0x00, 0x00, buffer).then(response => {
      const v = response[0];
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        v,
        r,
        s
      };
    });
  }
  /**
   * get Stark public key for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return the Stark public key
   */


  starkGetPublicKey(path, boolDisplay) {
    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport.send(0xf0, 0x02, boolDisplay ? 0x01 : 0x00, 0x00, buffer).then(response => {
      return response.slice(0, response.length - 2);
    });
  }
  /**
   * sign a Stark order
   * @param path a path in BIP 32 format
   * @option sourceTokenAddress contract address of the source token (not present for ETH)
   * @param sourceQuantization quantization used for the source token
   * @option destinationTokenAddress contract address of the destination token (not present for ETH)
   * @param destinationQuantization quantization used for the destination token
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountSell amount to sell
   * @param amountBuy amount to buy
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */


  starkSignOrder(path, sourceTokenAddress, sourceQuantization, destinationTokenAddress, destinationQuantization, sourceVault, destinationVault, amountSell, amountBuy, nonce, timestamp) {
    const sourceTokenAddressHex = maybeHexBuffer(sourceTokenAddress);
    const destinationTokenAddressHex = maybeHexBuffer(destinationTokenAddress);
    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4 + 20 + 32 + 20 + 32 + 4 + 4 + 8 + 8 + 4 + 4, 0);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;

    if (sourceTokenAddressHex) {
      sourceTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(sourceQuantization.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    offset += 32;

    if (destinationTokenAddressHex) {
      destinationTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(destinationQuantization.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountSell.toString(16).padStart(16, "0"), "hex").copy(buffer, offset);
    offset += 8;
    Buffer.from(amountBuy.toString(16).padStart(16, "0"), "hex").copy(buffer, offset);
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport.send(0xf0, 0x04, 0x01, 0x00, buffer).then(response => {
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        r,
        s
      };
    });
  }
  /**
   * sign a Stark order using the Starkex V2 protocol
   * @param path a path in BIP 32 format
   * @option sourceTokenAddress contract address of the source token (not present for ETH)
   * @param sourceQuantizationType quantization type used for the source token
   * @option sourceQuantization quantization used for the source token (not present for erc 721 or mintable erc 721)
   * @option sourceMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the source token
   * @option destinationTokenAddress contract address of the destination token (not present for ETH)
   * @param destinationQuantizationType quantization type used for the destination token
   * @option destinationQuantization quantization used for the destination token (not present for erc 721 or mintable erc 721)
   * @option destinationMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the destination token
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountSell amount to sell
   * @param amountBuy amount to buy
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */


  starkSignOrder_v2(path, sourceTokenAddress, sourceQuantizationType, sourceQuantization, sourceMintableBlobOrTokenId, destinationTokenAddress, destinationQuantizationType, destinationQuantization, destinationMintableBlobOrTokenId, sourceVault, destinationVault, amountSell, amountBuy, nonce, timestamp) {
    const sourceTokenAddressHex = maybeHexBuffer(sourceTokenAddress);
    const destinationTokenAddressHex = maybeHexBuffer(destinationTokenAddress);

    if (!(sourceQuantizationType in starkQuantizationTypeMap)) {
      throw new Error("eth.starkSignOrderv2 invalid source quantization type=" + sourceQuantizationType);
    }

    if (!(destinationQuantizationType in starkQuantizationTypeMap)) {
      throw new Error("eth.starkSignOrderv2 invalid destination quantization type=" + destinationQuantizationType);
    }

    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4 + 1 + 20 + 32 + 32 + 1 + 20 + 32 + 32 + 4 + 4 + 8 + 8 + 4 + 4, 0);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    buffer[offset] = starkQuantizationTypeMap[sourceQuantizationType];
    offset++;

    if (sourceTokenAddressHex) {
      sourceTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (sourceQuantization) {
      Buffer.from(sourceQuantization.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    }

    offset += 32;

    if (sourceMintableBlobOrTokenId) {
      Buffer.from(sourceMintableBlobOrTokenId.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    }

    offset += 32;
    buffer[offset] = starkQuantizationTypeMap[destinationQuantizationType];
    offset++;

    if (destinationTokenAddressHex) {
      destinationTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (destinationQuantization) {
      Buffer.from(destinationQuantization.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    }

    offset += 32;

    if (destinationMintableBlobOrTokenId) {
      Buffer.from(destinationMintableBlobOrTokenId.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    }

    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountSell.toString(16).padStart(16, "0"), "hex").copy(buffer, offset);
    offset += 8;
    Buffer.from(amountBuy.toString(16).padStart(16, "0"), "hex").copy(buffer, offset);
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport.send(0xf0, 0x04, 0x03, 0x00, buffer).then(response => {
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        r,
        s
      };
    });
  }
  /**
   * sign a Stark transfer
   * @param path a path in BIP 32 format
   * @option transferTokenAddress contract address of the token to be transferred (not present for ETH)
   * @param transferQuantization quantization used for the token to be transferred
   * @param targetPublicKey target Stark public key
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountTransfer amount to transfer
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @return the signature
   */


  starkSignTransfer(path, transferTokenAddress, transferQuantization, targetPublicKey, sourceVault, destinationVault, amountTransfer, nonce, timestamp) {
    const transferTokenAddressHex = maybeHexBuffer(transferTokenAddress);
    const targetPublicKeyHex = hexBuffer(targetPublicKey);
    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4 + 20 + 32 + 32 + 4 + 4 + 8 + 4 + 4, 0);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;

    if (transferTokenAddressHex) {
      transferTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;
    Buffer.from(transferQuantization.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    offset += 32;
    targetPublicKeyHex.copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountTransfer.toString(16).padStart(16, "0"), "hex").copy(buffer, offset);
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);
    return this.transport.send(0xf0, 0x04, 0x02, 0x00, buffer).then(response => {
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        r,
        s
      };
    });
  }
  /**
   * sign a Stark transfer or conditional transfer using the Starkex V2 protocol
   * @param path a path in BIP 32 format
   * @option transferTokenAddress contract address of the token to be transferred (not present for ETH)
   * @param transferQuantizationType quantization type used for the token to be transferred
   * @option transferQuantization quantization used for the token to be transferred (not present for erc 721 or mintable erc 721)
   * @option transferMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the token to be transferred
   * @param targetPublicKey target Stark public key
   * @param sourceVault ID of the source vault
   * @param destinationVault ID of the destination vault
   * @param amountTransfer amount to transfer
   * @param nonce transaction nonce
   * @param timestamp transaction validity timestamp
   * @option conditionalTransferAddress onchain address of the condition for a conditional transfer
   * @option conditionalTransferFact fact associated to the condition for a conditional transfer
   * @return the signature
   */


  starkSignTransfer_v2(path, transferTokenAddress, transferQuantizationType, transferQuantization, transferMintableBlobOrTokenId, targetPublicKey, sourceVault, destinationVault, amountTransfer, nonce, timestamp, conditionalTransferAddress, conditionalTransferFact) {
    const transferTokenAddressHex = maybeHexBuffer(transferTokenAddress);
    const targetPublicKeyHex = hexBuffer(targetPublicKey);
    const conditionalTransferAddressHex = maybeHexBuffer(conditionalTransferAddress);

    if (!(transferQuantizationType in starkQuantizationTypeMap)) {
      throw new Error("eth.starkSignTransferv2 invalid quantization type=" + transferQuantizationType);
    }

    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4 + 1 + 20 + 32 + 32 + 32 + 4 + 4 + 8 + 4 + 4 + (conditionalTransferAddressHex ? 32 + 20 : 0), 0);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    buffer[offset] = starkQuantizationTypeMap[transferQuantizationType];
    offset++;

    if (transferTokenAddressHex) {
      transferTokenAddressHex.copy(buffer, offset);
    }

    offset += 20;

    if (transferQuantization) {
      Buffer.from(transferQuantization.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    }

    offset += 32;

    if (transferMintableBlobOrTokenId) {
      Buffer.from(transferMintableBlobOrTokenId.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    }

    offset += 32;
    targetPublicKeyHex.copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32BE(sourceVault, offset);
    offset += 4;
    buffer.writeUInt32BE(destinationVault, offset);
    offset += 4;
    Buffer.from(amountTransfer.toString(16).padStart(16, "0"), "hex").copy(buffer, offset);
    offset += 8;
    buffer.writeUInt32BE(nonce, offset);
    offset += 4;
    buffer.writeUInt32BE(timestamp, offset);

    if (conditionalTransferAddressHex && conditionalTransferFact) {
      offset += 4;
      Buffer.from(conditionalTransferFact.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
      offset += 32;
      conditionalTransferAddressHex.copy(buffer, offset);
    }

    return this.transport.send(0xf0, 0x04, conditionalTransferAddressHex ? 0x05 : 0x04, 0x00, buffer).then(response => {
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        r,
        s
      };
    });
  }
  /**
   * provide quantization information before singing a deposit or withdrawal Stark powered contract call
   *
   * It shall be run following a provideERC20TokenInformation call for the given contract
   *
   * @param operationContract contract address of the token to be transferred (not present for ETH)
   * @param operationQuantization quantization used for the token to be transferred
   */


  starkProvideQuantum(operationContract, operationQuantization) {
    const operationContractHex = maybeHexBuffer(operationContract);
    let buffer = Buffer.alloc(20 + 32, 0);

    if (operationContractHex) {
      operationContractHex.copy(buffer, 0);
    }

    Buffer.from(operationQuantization.toString(16).padStart(64, "0"), "hex").copy(buffer, 20);
    return this.transport.send(0xf0, 0x08, 0x00, 0x00, buffer).then(() => true, e => {
      if (e && e.statusCode === 0x6d00) {
        // this case happen for ETH application versions not supporting Stark extensions
        return false;
      }

      throw e;
    });
  }
  /**
   * provide quantization information before singing a deposit or withdrawal Stark powered contract call using the Starkex V2 protocol
   *
   * It shall be run following a provideERC20TokenInformation call for the given contract
   *
   * @param operationContract contract address of the token to be transferred (not present for ETH)
   * @param operationQuantizationType quantization type of the token to be transferred
   * @option operationQuantization quantization used for the token to be transferred (not present for erc 721 or mintable erc 721)
   * @option operationMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) of the token to be transferred
   */


  starkProvideQuantum_v2(operationContract, operationQuantizationType, operationQuantization, operationMintableBlobOrTokenId) {
    const operationContractHex = maybeHexBuffer(operationContract);

    if (!(operationQuantizationType in starkQuantizationTypeMap)) {
      throw new Error("eth.starkProvideQuantumV2 invalid quantization type=" + operationQuantizationType);
    }

    let buffer = Buffer.alloc(20 + 32 + 32, 0);
    let offset = 0;

    if (operationContractHex) {
      operationContractHex.copy(buffer, offset);
    }

    offset += 20;

    if (operationQuantization) {
      Buffer.from(operationQuantization.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    }

    offset += 32;

    if (operationMintableBlobOrTokenId) {
      Buffer.from(operationMintableBlobOrTokenId.toString(16).padStart(64, "0"), "hex").copy(buffer, offset);
    }

    return this.transport.send(0xf0, 0x08, starkQuantizationTypeMap[operationQuantizationType], 0x00, buffer).then(() => true, e => {
      if (e && e.statusCode === 0x6d00) {
        // this case happen for ETH application versions not supporting Stark extensions
        return false;
      }

      throw e;
    });
  }
  /**
   * sign the given hash over the Stark curve
   * It is intended for speed of execution in case an unknown Stark model is pushed and should be avoided as much as possible.
   * @param path a path in BIP 32 format
   * @param hash hexadecimal hash to sign
   * @return the signature
   */


  starkUnsafeSign(path, hash) {
    const hashHex = hexBuffer(hash);
    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4 + 32);
    let offset = 0;
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    offset = 1 + 4 * paths.length;
    hashHex.copy(buffer, offset);
    return this.transport.send(0xf0, 0x0a, 0x00, 0x00, buffer).then(response => {
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
      return {
        r,
        s
      };
    });
  }
  /**
   * get an Ethereum 2 BLS-12 381 public key for a given BIP 32 path.
   * @param path a path in BIP 32 format
   * @option boolDisplay optionally enable or not the display
   * @return an object with a publicKey
   * @example
   * eth.eth2GetPublicKey("12381/3600/0/0").then(o => o.publicKey)
   */


  eth2GetPublicKey(path, boolDisplay) {
    let paths = (0, utils.splitPath)(path);
    let buffer = Buffer.alloc(1 + paths.length * 4);
    buffer[0] = paths.length;
    paths.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });
    return this.transport.send(0xe0, 0x0e, boolDisplay ? 0x01 : 0x00, 0x00, buffer).then(response => {
      let result = {};
      result.publicKey = response.slice(0, -2).toString("hex");
      return result;
    });
  }
  /**
   * Set the index of a Withdrawal key used as withdrawal credentials in an ETH 2 deposit contract call signature
   *
   * It shall be run before the ETH 2 deposit transaction is signed. If not called, the index is set to 0
   *
   * @param withdrawalIndex index path in the EIP 2334 path m/12381/3600/withdrawalIndex/0
   * @return True if the method was executed successfully
   */


  eth2SetWithdrawalIndex(withdrawalIndex) {
    let buffer = Buffer.alloc(4, 0);
    buffer.writeUInt32BE(withdrawalIndex, 0);
    return this.transport.send(0xe0, 0x10, 0x00, 0x00, buffer).then(() => true, e => {
      if (e && e.statusCode === 0x6d00) {
        // this case happen for ETH application versions not supporting ETH 2
        return false;
      }

      throw e;
    });
  }

}

exports.default = Eth;
//# sourceMappingURL=Eth.js.map
});

var Eth = unwrapExports(Eth_1);

/*
 * Bitcoin BIP32 path helpers
 * (C) 2016 Alex Beregszaszi
 */

const HARDENED = 0x80000000;

var BIPPath = function (path) {
  if (!Array.isArray(path)) {
    throw new Error('Input must be an Array')
  }
  if (path.length === 0) {
    throw new Error('Path must contain at least one level')
  }
  for (var i = 0; i < path.length; i++) {
    if (typeof path[i] !== 'number') {
      throw new Error('Path element is not a number')
    }
  }
  this.path = path;
};

BIPPath.validatePathArray = function (path) {
  try {
    BIPPath.fromPathArray(path);
    return true
  } catch (e) {
    return false
  }
};

BIPPath.validateString = function (text, reqRoot) {
  try {
    BIPPath.fromString(text, reqRoot);
    return true
  } catch (e) {
    return false
  }
};

BIPPath.fromPathArray = function (path) {
  return new BIPPath(path)
};

BIPPath.fromString = function (text, reqRoot) {
  // skip the root
  if (/^m\//i.test(text)) {
    text = text.slice(2);
  } else if (reqRoot) {
    throw new Error('Root element is required')
  }

  var path = text.split('/');
  var ret = new Array(path.length);
  for (var i = 0; i < path.length; i++) {
    var tmp = /(\d+)([hH\']?)/.exec(path[i]);
    if (tmp === null) {
      throw new Error('Invalid input')
    }
    ret[i] = parseInt(tmp[1], 10);

    if (ret[i] >= HARDENED) {
      throw new Error('Invalid child index')
    }

    if (tmp[2] === 'h' || tmp[2] === 'H' || tmp[2] === '\'') {
      ret[i] += HARDENED;
    } else if (tmp[2].length != 0) {
      throw new Error('Invalid modifier')
    }
  }
  return new BIPPath(ret)
};

BIPPath.prototype.toPathArray = function () {
  return this.path
};

BIPPath.prototype.toString = function (noRoot, oldStyle) {
  var ret = new Array(this.path.length);
  for (var i = 0; i < this.path.length; i++) {
    var tmp = this.path[i];
    if (tmp & HARDENED) {
      ret[i] = (tmp & ~HARDENED) + (oldStyle ? 'h' : '\'');
    } else {
      ret[i] = tmp;
    }
  }
  return (noRoot ? '' : 'm/') + ret.join('/')
};

BIPPath.prototype.inspect = function () {
  return 'BIPPath <' + this.toString() + '>'
};

var bip32Path = BIPPath;

var Avalanche_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});



var _bip32Path2 = _interopRequireDefault(bip32Path);



var _createHash2 = _interopRequireDefault(createHash__default['default']);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * Avalanche API
 *
 * @example
 * import Avalanche from "@obsidiansystems/hw-app-avalanche";
 * const avalanche = new Avalanche(transport);
 */
class Avalanche {

  constructor(transport, scrambleKey = "Avalanche", logger = console.error) {
    this.CLA = 0x80;
    this.MAX_APDU_SIZE = 230;
    this.MAX_HRP_LENGTH = 24;
    this.INS_VERSION = 0x00;
    this.INS_GET_WALLET_ID = 0x01;
    this.INS_PROMPT_PUBLIC_KEY = 0x02;
    this.INS_PROMPT_EXT_PUBLIC_KEY = 0x03;
    this.INS_SIGN_HASH = 0x04;
    this.INS_SIGN_TRANSACTION = 0x05;

    this.transport = transport;
    this.logger = logger;
    if (scrambleKey) {
      transport.decorateAppAPIMethods(this, ["getAppConfiguration", "getWalletAddress", "getWalletExtendedPublicKey", "getWalletId", "signHash", "signTransaction"], scrambleKey);
    }
  }

  /**
   * get Avalanche address for a given BIP-32 path.
   *
   * @param derivation_path a path in BIP 32 format
   * @return a buffer with a public key, and TODO: should be address, not public key
   * @example
   * await avalanche.getWalletPublicKey("44'/9000'/0'/0/0");
   */
  getWalletAddress(derivation_path, hrp = "") {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (hrp.length > _this.MAX_HRP_LENGTH) {
        throw "Maximum Bech32 'human readable part' length exceeded";
      }

      const cla = _this.CLA;
      const ins = _this.INS_PROMPT_PUBLIC_KEY;
      const p1 = hrp.length;
      const p2 = 0x00;
      const data = Buffer.concat([Buffer.from(hrp, "latin1"), _this.encodeBip32Path(_bip32Path2.default.fromString(derivation_path))]);

      const response = yield _this.transport.send(cla, ins, p1, p2, data);
      return response.slice(0, -2);
    })();
  }

  /**
   * get extended public key for a given BIP-32 path.
   *
   * @param derivation_path a path in BIP-32 format
   * @return an object with a buffer for the public key data and a buffer for the chain code
   * @example
   * await avalanche.getWalletExtendedPublicKey("44'/9000'/0'/0/0");
   */
  getWalletExtendedPublicKey(derivation_path) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const cla = _this2.CLA;
      const ins = _this2.INS_PROMPT_EXT_PUBLIC_KEY;
      const p1 = 0x00;
      const p2 = 0x00;
      const data = _this2.encodeBip32Path(_bip32Path2.default.fromString(derivation_path));

      const response = yield _this2.transport.send(cla, ins, p1, p2, data);
      const publicKeyLength = response[0];
      const chainCodeOffset = 2 + publicKeyLength;
      const chainCodeLength = response[1 + publicKeyLength];
      return {
        public_key: response.slice(1, 1 + publicKeyLength),
        chain_code: response.slice(chainCodeOffset, chainCodeOffset + chainCodeLength)
      };
    })();
  }

  /**
   * Sign a hash with a given set of BIP-32 paths.
   *
   * @param derivationPathPrefix a BIP-32 path that will act as the prefix to all other signing paths.
   * @param derivationPathSuffixes an array of BIP-32 path suffixes that will be
   *                               appended to the prefix to form the final path for signing.
   * @param hash 32-byte buffer containing the hash to sign
   * @return a map of path suffixes (as strings) to signature buffers
   * @example
   * const signatures = await avalanche.signHash(
   *   BIPPath.fromString("44'/9000'/0'"),
   *   [BIPPath.fromString("0/0")],
   *   Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex"));
   */
  signHash(derivationPathPrefix, derivationPathSuffixes, hash) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      if (hash.length != 32) {
        throw "Hash buffer must be 32 bytes";
      }

      const firstMessage = Buffer.concat([_this3.uInt8Buffer(derivationPathSuffixes.length), hash, _this3.encodeBip32Path(derivationPathPrefix)]);
      const responseHash = yield _this3.transport.send(_this3.CLA, _this3.INS_SIGN_HASH, 0x00, 0x00, firstMessage);
      if (!responseHash.slice(0, 32).equals(hash)) {
        throw "Ledger reported a hash that does not match the input hash!";
      }

      return _this3._collectSignaturesFromSuffixes(derivationPathSuffixes, _this3.INS_SIGN_HASH, 0x01, 0x81);
    })();
  }

  /**
   * Sign a transaction with a given set of BIP-32 paths.
   *
   * @param derivationPathPrefix a BIP-32 path that will act as the prefix to all other signing paths.
   * @param derivationPathSuffixes an array of BIP-32 path suffixes that will be
   *                               appended to the prefix to form the final path for signing.
   * @param txn binary of the transaction
   * @return an object with a hash of the transaction and a map of path suffixes (as strings) to signature buffers
   * @example
   * const signatures = await avalanche.signTransaction(
   *   BIPPath.fromString("44'/9000'/0'"),
   *   [BIPPath.fromString("0/0")],
   *   Buffer.from("...", "hex"),
   *   BIPPath.fromString("44'/9000'/0'/0'/0'"));
   * );
   */
  signTransaction(derivationPathPrefix, derivationPathSuffixes, txn, changePath) {
    var _this4 = this;

    return _asyncToGenerator(function* () {

      const SIGN_TRANSACTION_SECTION_PREAMBLE = 0x00;
      const SIGN_TRANSACTION_SECTION_PAYLOAD_CHUNK = 0x01;
      const SIGN_TRANSACTION_SECTION_PAYLOAD_CHUNK_LAST = 0x81;
      const SIGN_TRANSACTION_SECTION_SIGN_WITH_PATH = 0x02;
      const SIGN_TRANSACTION_SECTION_SIGN_WITH_PATH_LAST = 0x82;

      const preamble = Buffer.concat([_this4.uInt8Buffer(derivationPathSuffixes.length), _this4.encodeBip32Path(derivationPathPrefix)]);
      if (changePath != null) {
        const preamble_ = Buffer.concat([preamble, _this4.encodeBip32Path(changePath)]);
        yield _this4.transport.send(_this4.CLA, _this4.INS_SIGN_TRANSACTION, SIGN_TRANSACTION_SECTION_PREAMBLE, 0x01, preamble_);
      } else {
        yield _this4.transport.send(_this4.CLA, _this4.INS_SIGN_TRANSACTION, SIGN_TRANSACTION_SECTION_PREAMBLE, 0x00, preamble);
      }

      let remainingData = txn.slice(0); // copy
      let response;
      while (remainingData.length > 0) {
        const thisChunk = remainingData.slice(0, _this4.MAX_APDU_SIZE);
        remainingData = remainingData.slice(_this4.MAX_APDU_SIZE);
        response = yield _this4.transport.send(_this4.CLA, _this4.INS_SIGN_TRANSACTION, remainingData.length > 0 ? SIGN_TRANSACTION_SECTION_PAYLOAD_CHUNK : SIGN_TRANSACTION_SECTION_PAYLOAD_CHUNK_LAST, 0x00, thisChunk);
      }

      const responseHash = response.slice(0, 32);
      const expectedHash = Buffer.from((0, _createHash2.default)('sha256').update(txn).digest());
      if (!responseHash.equals(expectedHash)) {
        throw "Ledger reported a hash that does not match the expected transaction hash!";
      }

      return {
        hash: responseHash,
        signatures: yield _this4._collectSignaturesFromSuffixes(derivationPathSuffixes, _this4.INS_SIGN_TRANSACTION, SIGN_TRANSACTION_SECTION_SIGN_WITH_PATH, SIGN_TRANSACTION_SECTION_SIGN_WITH_PATH_LAST)
      };
    })();
  }

  /**
   * Get the version of the Avalanche app installed on the hardware device
   *
   * @return an object with a version
   * @example
   * console.log(await avalanche.getAppConfiguration());
   *
   * {
   *   "version": "1.0.3",
   *   "commit": "abcdcefg"
   *   "name": "Avalanche"
   * }
   */
  getAppConfiguration() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const data = yield _this5.transport.send(_this5.CLA, _this5.INS_VERSION, 0x00, 0x00);

      const eatNBytes = function (input, n) {
        const out = input.slice(0, n);
        return [out, input.slice(n)];
      };

      const eatWhile = function (input, f) {
        for (var i = 0; i < input.length; i++) {
          if (!f(input[i])) {
            return [input.slice(0, i), input.slice(i)];
          }
        }
        return [input, ""];
      };

      const [versionData, rest1] = eatNBytes(data, 3);
      const [commitData, rest2] = eatWhile(rest1, function (c) {
        return c != 0;
      });
      const [nameData, rest3] = eatWhile(rest2.slice(1), function (c) {
        return c != 0;
      });
      if (rest3.toString("hex") != "009000") {
        _this5.logger("WARNING: Response data does not exactly match expected format for VERSION instruction");
      }

      return {
        version: "" + versionData[0] + "." + versionData[1] + "." + versionData[2],
        commit: commitData.toString("latin1"),
        name: nameData.toString("latin1")
      };
    })();
  }

  /**
   * Get the wallet identifier for the Ledger wallet
   *
   * @return a byte string
   * @example
   * console.log((await avalanche.getWalletId()).toString("hex"));
   *
   * 79c46bc3
   */
  getWalletId() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      const result = yield _this6.transport.send(_this6.CLA, _this6.INS_GET_WALLET_ID, 0x00, 0x00);
      return result.slice(0, -2);
    })();
  }

  _collectSignaturesFromSuffixes(suffixes, ins, p1NotDone, p1Done) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      let resultMap = new Map();
      for (let ix = 0; ix < suffixes.length; ix++) {
        const suffix = suffixes[ix];
        _this7.logger("Signing with " + suffix.toString(true));
        const message = _this7.encodeBip32Path(suffix);
        const isLastMessage = ix >= suffixes.length - 1;
        const signatureData = yield _this7.transport.send(_this7.CLA, ins, isLastMessage ? p1Done : p1NotDone, 0x00, message);
        resultMap.set(suffix.toString(true), signatureData.slice(0, -2));
      }      return resultMap;
    })();
  }

  uInt8Buffer(uint8) {
    let buff = Buffer.alloc(1);
    buff.writeUInt8(uint8);
    return buff;
  }

  uInt32BEBuffer(uint32) {
    let buff = Buffer.alloc(4);
    buff.writeUInt32BE(uint32);
    return buff;
  }

  encodeBip32Path(path) {
    const pathArr = path.toPathArray();
    return Buffer.concat([this.uInt8Buffer(pathArr.length)].concat(pathArr.map(this.uInt32BEBuffer)));
  }
}
exports.default = Avalanche;
//# sourceMappingURL=Avalanche.js.map
});

var AppAvax = unwrapExports(Avalanche_1);

// @ts-ignore
var LedgerWallet = /** @class */ (function (_super) {
    __extends(LedgerWallet, _super);
    function LedgerWallet(avaxAcct, evmAcct, avaxApp, ethApp, config) {
        var _this = _super.call(this, avaxAcct) || this;
        _this.type = 'ledger';
        _this.evmAccount = evmAcct;
        _this.config = config;
        _this.appAvax = avaxApp;
        _this.ethApp = ethApp;
        _this.evmWallet = new EvmWalletReadonly(ethereumjsUtil.importPublic(evmAcct.publicKey));
        return _this;
    }
    /**
     * Create a new ledger wallet instance from the given transport
     * @param transport
     */
    LedgerWallet.fromTransport = function (transport) {
        return __awaiter(this, void 0, void 0, function () {
            var app, eth, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transport.setExchangeTimeout(LEDGER_EXCHANGE_TIMEOUT);
                        app = new AppAvax(transport, 'w0w');
                        eth = new Eth(transport, 'w0w');
                        return [4 /*yield*/, app.getAppConfiguration()];
                    case 1:
                        config = _a.sent();
                        if (!config) {
                            throw new Error("Unable to connect ledger. You must use ledger version " + MIN_EVM_SUPPORT_V + " or above.");
                        }
                        if (config.version < MIN_EVM_SUPPORT_V) {
                            throw new Error("Unable to connect ledger. You must use ledger version " + MIN_EVM_SUPPORT_V + " or above.");
                        }
                        return [4 /*yield*/, LedgerWallet.fromApp(app, eth)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    LedgerWallet.getAvaxAccount = function (app) {
        return __awaiter(this, void 0, void 0, function () {
            var res, hd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, app.getWalletExtendedPublicKey(AVAX_ACCOUNT_PATH)];
                    case 1:
                        res = _a.sent();
                        hd = new HDKey__default['default']();
                        hd.publicKey = res.public_key;
                        hd.chainCode = res.chain_code;
                        return [2 /*return*/, hd];
                }
            });
        });
    };
    LedgerWallet.getEvmAccount = function (eth) {
        return __awaiter(this, void 0, void 0, function () {
            var ethRes, hdEth;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, eth.getAddress(LEDGER_ETH_ACCOUNT_PATH, true, true)];
                    case 1:
                        ethRes = _a.sent();
                        hdEth = new HDKey__default['default']();
                        // @ts-ignore
                        hdEth.publicKey = avalanche$1.Buffer.from(ethRes.publicKey, 'hex');
                        // @ts-ignore
                        hdEth.chainCode = avalanche$1.Buffer.from(ethRes.chainCode, 'hex');
                        return [2 /*return*/, hdEth];
                }
            });
        });
    };
    LedgerWallet.fromApp = function (app, eth) {
        return __awaiter(this, void 0, void 0, function () {
            var avaxAccount, evmAccount, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, LedgerWallet.getAvaxAccount(app)];
                    case 1:
                        avaxAccount = _a.sent();
                        return [4 /*yield*/, LedgerWallet.getEvmAccount(eth)];
                    case 2:
                        evmAccount = _a.sent();
                        return [4 /*yield*/, app.getAppConfiguration()];
                    case 3:
                        config = _a.sent();
                        return [2 /*return*/, new LedgerWallet(avaxAccount, evmAccount, app, eth, config)];
                }
            });
        });
    };
    LedgerWallet.prototype.getAddressC = function () {
        return this.evmWallet.getAddress();
    };
    LedgerWallet.prototype.getEvmAddressBech = function () {
        var keypair = new keychain$1.KeyPair(avalanche.getHRP(), 'C');
        var addr = keypair.addressFromPublicKey(avalanche$1.Buffer.from(this.evmAccount.publicKey));
        return bintools$1.addressToString(avalanche.getHRP(), 'C', addr);
    };
    LedgerWallet.prototype.signEvm = function (tx$1) {
        return __awaiter(this, void 0, void 0, function () {
            var rawUnsignedTx, signature, signatureBN, chainId, networkId, common, chainParams, signedTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rawUnsignedTx = ethereumjsUtil.rlp.encode([
                            ethereumjsUtil.bnToRlp(tx$1.nonce),
                            ethereumjsUtil.bnToRlp(tx$1.gasPrice),
                            ethereumjsUtil.bnToRlp(tx$1.gasLimit),
                            tx$1.to !== undefined ? tx$1.to.buf : avalanche$1.Buffer.from([]),
                            ethereumjsUtil.bnToRlp(tx$1.value),
                            tx$1.data,
                            ethereumjsUtil.bnToRlp(tx$1.common.chainIdBN()),
                            avalanche$1.Buffer.from([]),
                            avalanche$1.Buffer.from([]),
                        ]);
                        return [4 /*yield*/, this.ethApp.signTransaction(LEDGER_ETH_ACCOUNT_PATH, rawUnsignedTx)];
                    case 1:
                        signature = _a.sent();
                        signatureBN = {
                            v: new ethereumjsUtil.BN(signature.v, 16),
                            r: new ethereumjsUtil.BN(signature.r, 16),
                            s: new ethereumjsUtil.BN(signature.s, 16),
                        };
                        return [4 /*yield*/, web3.eth.getChainId()];
                    case 2:
                        chainId = _a.sent();
                        return [4 /*yield*/, web3.eth.net.getId()];
                    case 3:
                        networkId = _a.sent();
                        common = EthereumjsCommon__default['default'].forCustomChain('mainnet', { networkId: networkId, chainId: chainId }, 'istanbul');
                        chainParams = {
                            common: common,
                        };
                        signedTx = tx.Transaction.fromTxData(__assign({ nonce: tx$1.nonce, gasPrice: tx$1.gasPrice, gasLimit: tx$1.gasLimit, to: tx$1.to, value: tx$1.value, data: tx$1.data }, signatureBN), chainParams);
                        return [2 /*return*/, signedTx];
                }
            });
        });
    };
    // Returns an array of derivation paths that need to sign this transaction
    // Used with signTransactionHash and signTransactionParsable
    LedgerWallet.prototype.getTransactionPaths = function (unsignedTx, chainId) {
        var tx = unsignedTx.getTransaction();
        var txType = tx.getTxType();
        var ins = tx.getIns();
        var operations = [];
        // Try to get operations, it will fail if there are none, ignore and continue
        try {
            operations = tx.getOperations();
        }
        catch (e) {
            console.log('Failed to get tx operations.');
        }
        var items = ins;
        if ((txType === avm.AVMConstants.IMPORTTX && chainId === 'X') ||
            (txType === platformvm.PlatformVMConstants.IMPORTTX && chainId === 'P')) {
            items = (tx || platformvm.ImportTx).getImportInputs();
        }
        var hrp = avalanche.getHRP();
        var paths = [];
        var isAvaxOnly = true;
        // Collect paths derivation paths for source addresses
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var assetId = bintools$1.cb58Encode(item.getAssetID());
            // @ts-ignore
            // if (assetId !== store.state.Assets.AVA_ASSET_ID) {
            if (assetId !== activeNetwork$1.avaxID) {
                isAvaxOnly = false;
            }
            var sigidxs = item.getInput().getSigIdxs();
            var sources = sigidxs.map(function (sigidx) { return sigidx.getSource(); });
            var addrs = sources.map(function (source) {
                return bintools$1.addressToString(hrp, chainId, source);
            });
            for (var j = 0; j < addrs.length; j++) {
                var srcAddr = addrs[j];
                var pathStr = this.getPathFromAddress(srcAddr); // returns change/index
                paths.push(pathStr);
            }
        }
        // Do the Same for operational inputs, if there are any...
        for (var i = 0; i < operations.length; i++) {
            var op = operations[i];
            var sigidxs = op.getOperation().getSigIdxs();
            var sources = sigidxs.map(function (sigidx) { return sigidx.getSource(); });
            var addrs = sources.map(function (source) {
                return bintools$1.addressToString(hrp, chainId, source);
            });
            for (var j = 0; j < addrs.length; j++) {
                var srcAddr = addrs[j];
                var pathStr = this.getPathFromAddress(srcAddr); // returns change/index
                paths.push(pathStr);
            }
        }
        return { paths: paths, isAvaxOnly: isAvaxOnly };
    };
    LedgerWallet.prototype.getPathFromAddress = function (address) {
        var externalAddrs = this.externalScan.getAllAddresses();
        var internalAddrs = this.internalScan.getAllAddresses();
        var platformAddrs = this.externalScan.getAllAddresses('P');
        var extIndex = externalAddrs.indexOf(address);
        var intIndex = internalAddrs.indexOf(address);
        var platformIndex = platformAddrs.indexOf(address);
        if (extIndex >= 0) {
            return "0/" + extIndex;
        }
        else if (intIndex >= 0) {
            return "1/" + intIndex;
        }
        else if (platformIndex >= 0) {
            return "0/" + platformIndex;
        }
        else if (address[0] === 'C') {
            return '0/0';
        }
        else {
            throw new Error('Unable to find source address.');
        }
    };
    LedgerWallet.prototype.signX = function (unsignedTx) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, txType, chainId, parseableTxs, _a, paths, isAvaxOnly, canLedgerParse, isParsableType, signedTx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tx = unsignedTx.getTransaction();
                        txType = tx.getTxType();
                        chainId = 'X';
                        parseableTxs = ParseableAvmTxEnum;
                        _a = this.getTransactionPaths(unsignedTx, chainId), paths = _a.paths, isAvaxOnly = _a.isAvaxOnly;
                        canLedgerParse = this.config.version >= '0.3.1';
                        isParsableType = txType in parseableTxs && isAvaxOnly;
                        if (!(canLedgerParse && isParsableType)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.signTransactionParsable(unsignedTx, paths, chainId)];
                    case 1:
                        signedTx = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.signTransactionHash(unsignedTx, paths, chainId)];
                    case 3:
                        signedTx = _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/, signedTx];
                }
            });
        });
    };
    LedgerWallet.prototype.getChangePath = function (chainId) {
        switch (chainId) {
            case 'P':
                return 'm/0';
            case 'X':
            default:
                return 'm/1';
        }
    };
    LedgerWallet.prototype.getChangeIndex = function (chainId) {
        switch (chainId) {
            case 'P':
                // return this.platformHelper.hdIndex
                return this.externalScan.getIndex();
            case 'X':
            default:
                // return this.internalHelper.hdIndex
                return this.internalScan.getIndex();
        }
    };
    LedgerWallet.prototype.getChangeBipPath = function (unsignedTx, chainId) {
        if (chainId === 'C') {
            return null;
        }
        var tx = unsignedTx.getTransaction();
        var txType = tx.getTxType();
        var chainChangePath = this.getChangePath(chainId).split('m/')[1];
        var changeIdx = this.getChangeIndex(chainId);
        // If change and destination paths are the same
        // it can cause ledger to not display the destination amt.
        // Since platform helper does not have internal/external
        // path for change (it uses the external index)
        // there will be address collisions. So return null.
        if (txType === platformvm.PlatformVMConstants.IMPORTTX ||
            txType === platformvm.PlatformVMConstants.EXPORTTX ||
            txType === platformvm.PlatformVMConstants.ADDVALIDATORTX ||
            txType === platformvm.PlatformVMConstants.ADDDELEGATORTX) {
            return null;
        }
        // else if (txType === PlatformVMConstants.ADDVALIDATORTX || txType === PlatformVMConstants.ADDDELEGATORTX) {
        // changeIdx = this.platformHelper.getFirstAvailableIndex()
        // changeIdx = this.externalScan.getIndex();
        // }
        return bip32Path.fromString(AVAX_ACCOUNT_PATH + "/" + chainChangePath + "/" + changeIdx);
    };
    // Used for signing transactions that are parsable
    LedgerWallet.prototype.signTransactionParsable = function (unsignedTx, paths, chainId) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, txType, parseableTxs, bip32Paths, accountPath, txbuff, changePath, ledgerSignedTx, sigMap, creds, signedTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = unsignedTx.getTransaction();
                        txType = tx.getTxType();
                        parseableTxs = {
                            X: ParseableAvmTxEnum,
                            P: ParseablePlatformEnum,
                            C: ParseableEvmTxEnum,
                        }[chainId];
                        "Sign " + parseableTxs[txType];
                        bip32Paths = this.pathsToUniqueBipPaths(paths);
                        accountPath = chainId === 'C' ? bip32Path.fromString("" + ETH_ACCOUNT_PATH) : bip32Path.fromString("" + AVAX_ACCOUNT_PATH);
                        txbuff = unsignedTx.toBuffer();
                        changePath = this.getChangeBipPath(unsignedTx, chainId);
                        return [4 /*yield*/, this.appAvax.signTransaction(accountPath, bip32Paths, txbuff, changePath)];
                    case 1:
                        ledgerSignedTx = _a.sent();
                        sigMap = ledgerSignedTx.signatures;
                        creds = this.getCredentials(unsignedTx, paths, sigMap, chainId);
                        switch (chainId) {
                            case 'X':
                                signedTx = new avm.Tx(unsignedTx, creds);
                                break;
                            case 'P':
                                signedTx = new platformvm.Tx(unsignedTx, creds);
                                break;
                            case 'C':
                                signedTx = new evm.Tx(unsignedTx, creds);
                                break;
                        }
                        return [2 /*return*/, signedTx];
                }
            });
        });
    };
    // Used for non parsable transactions.
    // Ideally we wont use this function at all, but ledger is not ready yet.
    LedgerWallet.prototype.signTransactionHash = function (unsignedTx, paths, chainId) {
        return __awaiter(this, void 0, void 0, function () {
            var txbuff, msg, bip32Paths, accountPath, sigMap, creds, signedTx;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        txbuff = unsignedTx.toBuffer();
                        msg = avalanche$1.Buffer.from(createHash__default['default']('sha256').update(txbuff).digest());
                        bip32Paths = this.pathsToUniqueBipPaths(paths);
                        accountPath = bip32Path.fromString("" + AVAX_ACCOUNT_PATH);
                        return [4 /*yield*/, this.appAvax.signHash(accountPath, bip32Paths, msg)];
                    case 1:
                        sigMap = _a.sent();
                        creds = this.getCredentials(unsignedTx, paths, sigMap, chainId);
                        switch (chainId) {
                            case 'X':
                                signedTx = new avm.Tx(unsignedTx, creds);
                                break;
                            case 'P':
                                signedTx = new platformvm.Tx(unsignedTx, creds);
                                break;
                            case 'C':
                                signedTx = new evm.Tx(unsignedTx, creds);
                                break;
                        }
                        return [2 /*return*/, signedTx];
                }
            });
        });
    };
    LedgerWallet.prototype.pathsToUniqueBipPaths = function (paths) {
        var uniquePaths = paths.filter(function (val, i) {
            return paths.indexOf(val) === i;
        });
        var bip32Paths = uniquePaths.map(function (path) {
            return bip32Path.fromString(path, false);
        });
        return bip32Paths;
    };
    LedgerWallet.prototype.getCredentials = function (unsignedTx, paths, sigMap, chainId) {
        var creds = [];
        var tx = unsignedTx.getTransaction();
        var txType = tx.getTxType();
        // @ts-ignore
        var ins = tx.getIns ? tx.getIns() : [];
        var operations = [];
        var evmInputs = [];
        var items = ins;
        if ((txType === avm.AVMConstants.IMPORTTX && chainId === 'X') ||
            (txType === platformvm.PlatformVMConstants.IMPORTTX && chainId === 'P') ||
            (txType === evm.EVMConstants.IMPORTTX && chainId === 'C')) {
            items = (tx || platformvm.ImportTx || evm.ImportTx).getImportInputs();
        }
        // Try to get operations, it will fail if there are none, ignore and continue
        try {
            operations = tx.getOperations();
        }
        catch (e) {
            console.log('Failed to get tx operations.');
        }
        var CredentialClass;
        if (chainId === 'X') {
            CredentialClass = avm.SelectCredentialClass;
        }
        else if (chainId === 'P') {
            CredentialClass = platformvm.SelectCredentialClass;
        }
        else {
            CredentialClass = evm.SelectCredentialClass;
        }
        // Try to get evm inputs, it will fail if there are none, ignore and continue
        try {
            evmInputs = tx.getInputs();
        }
        catch (e) {
            console.log('Failed to get EVM inputs.');
        }
        for (var i = 0; i < items.length; i++) {
            var sigidxs = items[i].getInput().getSigIdxs();
            var cred = CredentialClass(items[i].getInput().getCredentialID());
            for (var j = 0; j < sigidxs.length; j++) {
                var pathIndex = i + j;
                var pathStr = paths[pathIndex];
                var sigRaw = sigMap.get(pathStr);
                var sigBuff = avalanche$1.Buffer.from(sigRaw);
                var sig = new common.Signature();
                sig.fromBuffer(sigBuff);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }
        for (var i = 0; i < operations.length; i++) {
            var op = operations[i].getOperation();
            var sigidxs = op.getSigIdxs();
            var cred = CredentialClass(op.getCredentialID());
            for (var j = 0; j < sigidxs.length; j++) {
                var pathIndex = items.length + i + j;
                var pathStr = paths[pathIndex];
                var sigRaw = sigMap.get(pathStr);
                var sigBuff = avalanche$1.Buffer.from(sigRaw);
                var sig = new common.Signature();
                sig.fromBuffer(sigBuff);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }
        for (var i = 0; i < evmInputs.length; i++) {
            var evmInput = evmInputs[i];
            var sigidxs = evmInput.getSigIdxs();
            var cred = CredentialClass(evmInput.getCredentialID());
            for (var j = 0; j < sigidxs.length; j++) {
                var pathIndex = items.length + i + j;
                var pathStr = paths[pathIndex];
                var sigRaw = sigMap.get(pathStr);
                var sigBuff = avalanche$1.Buffer.from(sigRaw);
                var sig = new common.Signature();
                sig.fromBuffer(sigBuff);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }
        return creds;
    };
    LedgerWallet.prototype.signP = function (unsignedTx) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, txType, chainId, parseableTxs, _a, paths, isAvaxOnly, canLedgerParse, isParsableType, txIns, i, typeID, signedTx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tx = unsignedTx.getTransaction();
                        txType = tx.getTxType();
                        chainId = 'P';
                        parseableTxs = ParseablePlatformEnum;
                        _a = this.getTransactionPaths(unsignedTx, chainId), paths = _a.paths, isAvaxOnly = _a.isAvaxOnly;
                        canLedgerParse = this.config.version >= '0.3.1';
                        isParsableType = txType in parseableTxs && isAvaxOnly;
                        txIns = unsignedTx.getTransaction().getIns();
                        for (i = 0; i < txIns.length; i++) {
                            typeID = txIns[i].getInput().getTypeID();
                            if (typeID === platformvm.PlatformVMConstants.STAKEABLELOCKINID) {
                                canLedgerParse = false;
                                break;
                            }
                        }
                        if (!(canLedgerParse && isParsableType)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.signTransactionParsable(unsignedTx, paths, chainId)];
                    case 1:
                        signedTx = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.signTransactionHash(unsignedTx, paths, chainId)];
                    case 3:
                        signedTx = _b.sent();
                        _b.label = 4;
                    case 4: 
                    // store.commit('Ledger/closeModal')
                    return [2 /*return*/, signedTx];
                }
            });
        });
    };
    LedgerWallet.prototype.signC = function (unsignedTx) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, typeId, paths, ins, ins, txSigned;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = unsignedTx.getTransaction();
                        typeId = tx.getTxType();
                        paths = ['0/0'];
                        if (typeId === evm.EVMConstants.EXPORTTX) {
                            ins = tx.getInputs();
                            paths = ins.map(function () { return '0/0'; });
                        }
                        else if (typeId === evm.EVMConstants.IMPORTTX) {
                            ins = tx.getImportInputs();
                            paths = ins.map(function () { return '0/0'; });
                        }
                        return [4 /*yield*/, this.signTransactionParsable(unsignedTx, paths, 'C')];
                    case 1:
                        txSigned = (_a.sent());
                        // store.commit('Ledger/closeModal')
                        return [2 /*return*/, txSigned];
                }
            });
        });
    };
    return LedgerWallet;
}(HDWalletAbstract));

/**
 * @ignore
 */
/**
 * Helper utility for encryption and password hashing, browser-safe.
 * Encryption is using AES-GCM with a random public nonce.
 */
var CryptoHelpers = /** @class */ (function () {
    function CryptoHelpers() {
        this.ivSize = 12;
        this.saltSize = 16;
        this.tagLength = 128;
        this.aesLength = 256;
        this.keygenIterations = 200000; //3.0, 2.0 uses 100000
    }
    /**
     * Internal-intended function for cleaning passwords.
     *
     * @param password
     * @param salt
     */
    CryptoHelpers.prototype._pwcleaner = function (password, slt) {
        var pw = _.Buffer.from(password, 'utf8');
        return this.sha256(_.Buffer.concat([pw, slt]));
    };
    /**
     * Internal-intended function for producing an intermediate key.
     *
     * @param pwkey
     */
    CryptoHelpers.prototype._keyMaterial = function (pwkey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, crypto.subtle.importKey('raw', new Uint8Array(pwkey), { name: 'PBKDF2' }, false, ['deriveKey'])];
            });
        });
    };
    /**
     * Internal-intended function for turning an intermediate key into a salted key.
     *
     * @param keyMaterial
     * @param salt
     */
    CryptoHelpers.prototype._deriveKey = function (keyMaterial, salt) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, crypto.subtle.deriveKey({
                        name: 'PBKDF2',
                        salt: salt,
                        iterations: this.keygenIterations,
                        hash: 'SHA-256',
                    }, keyMaterial, { name: 'AES-GCM', length: this.aesLength }, false, ['encrypt', 'decrypt'])];
            });
        });
    };
    /**
     * A SHA256 helper function.
     *
     * @param message The message to hash
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the SHA256 hash of the message
     */
    CryptoHelpers.prototype.sha256 = function (message) {
        var buff;
        if (typeof message === 'string') {
            buff = _.Buffer.from(message, 'utf8');
        }
        else {
            buff = _.Buffer.from(message);
        }
        return _.Buffer.from(createHash__default['default']('sha256').update(buff).digest()); // ensures correct Buffer class is used
    };
    /**
     * Generates a randomized {@link https://github.com/feross/buffer|Buffer} to be used as a salt
     */
    CryptoHelpers.prototype.makeSalt = function () {
        var salt = _.Buffer.alloc(this.saltSize);
        crypto.getRandomValues(salt);
        return salt;
    };
    /**
     * Produces a password-safe hash.
     *
     * @param password A string for the password
     * @param salt An optional {@link https://github.com/feross/buffer|Buffer} containing a salt used in the password hash
     *
     * @returns An object containing the "salt" and the "hash" produced by this function, both as {@link https://github.com/feross/buffer|Buffer}.
     */
    CryptoHelpers.prototype.pwhash = function (password, salt) {
        return __awaiter(this, void 0, void 0, function () {
            var slt, hash;
            return __generator(this, function (_a) {
                if (salt instanceof _.Buffer) {
                    slt = salt;
                    // @ts-ignore
                }
                else if (salt instanceof Uint8Array && process.env.NODE_ENV === 'test') {
                    slt = salt;
                }
                else {
                    slt = this.makeSalt();
                }
                hash = this._pwcleaner(password, this._pwcleaner(password, slt));
                return [2 /*return*/, { salt: slt, hash: hash }];
            });
        });
    };
    /**
     * Encrypts plaintext with the provided password using AES-GCM.
     *
     * @param password A string for the password
     * @param plaintext The plaintext to encrypt
     * @param salt An optional {@link https://github.com/feross/buffer|Buffer} for the salt to use in the encryption process
     *
     * @returns An object containing the "salt", "iv", and "ciphertext", all as {@link https://github.com/feross/buffer|Buffer}.
     */
    CryptoHelpers.prototype.encrypt = function (password, plaintext, salt) {
        if (salt === void 0) { salt = undefined; }
        return __awaiter(this, void 0, void 0, function () {
            var slt, pt, pwkey, keyMaterial, pkey, iv, ciphertext, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (typeof salt !== 'undefined' && salt instanceof _.Buffer) {
                            slt = salt;
                        }
                        else {
                            slt = this.makeSalt();
                        }
                        if (typeof plaintext !== 'undefined' && plaintext instanceof _.Buffer) {
                            pt = plaintext;
                        }
                        else {
                            pt = _.Buffer.from(plaintext, 'utf8');
                        }
                        pwkey = this._pwcleaner(password, slt);
                        return [4 /*yield*/, this._keyMaterial(pwkey)];
                    case 1:
                        keyMaterial = _c.sent();
                        return [4 /*yield*/, this._deriveKey(keyMaterial, slt)];
                    case 2:
                        pkey = _c.sent();
                        iv = _.Buffer.from(crypto.getRandomValues(new Uint8Array(this.ivSize)));
                        _b = (_a = _.Buffer).from;
                        return [4 /*yield*/, crypto.subtle.encrypt({
                                name: 'AES-GCM',
                                iv: iv,
                                additionalData: slt,
                                tagLength: this.tagLength,
                            }, pkey, pt)];
                    case 3:
                        ciphertext = _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/, {
                                salt: slt,
                                iv: iv,
                                ciphertext: ciphertext,
                            }];
                }
            });
        });
    };
    /**
     * Decrypts ciphertext with the provided password, iv, and salt.
     *
     * @param password A string for the password
     * @param ciphertext A {@link https://github.com/feross/buffer|Buffer} for the ciphertext
     * @param salt A {@link https://github.com/feross/buffer|Buffer} for the salt
     * @param iv A {@link https://github.com/feross/buffer|Buffer} for the iv
     */
    CryptoHelpers.prototype.decrypt = function (password, ciphertext, salt, iv) {
        return __awaiter(this, void 0, void 0, function () {
            var pwkey, keyMaterial, pkey, pt, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        pwkey = this._pwcleaner(password, salt);
                        return [4 /*yield*/, this._keyMaterial(pwkey)];
                    case 1:
                        keyMaterial = _c.sent();
                        return [4 /*yield*/, this._deriveKey(keyMaterial, salt)];
                    case 2:
                        pkey = _c.sent();
                        _b = (_a = _.Buffer).from;
                        return [4 /*yield*/, crypto.subtle.decrypt({
                                name: 'AES-GCM',
                                iv: iv,
                                additionalData: salt,
                                tagLength: 128, // The tagLength you used to encrypt (if any)
                            }, pkey, // from generateKey or importKey above
                            ciphertext // ArrayBuffer of the data
                            )];
                    case 3:
                        pt = _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/, pt];
                }
            });
        });
    };
    return CryptoHelpers;
}());

var cryptoHelpers = new CryptoHelpers();
var KEYSTORE_VERSION = '6.0';
var ITERATIONS_V2 = 100000;
var ITERATIONS_V3 = 200000; // and any version above
function readV2(data, pass) {
    return __awaiter(this, void 0, void 0, function () {
        var version, salt, pass_hash, checkHashString, checkHash, keys, keysDecrypt, i, key_data, key, nonce, key_decrypt, key_string;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    version = data.version;
                    cryptoHelpers.keygenIterations = ITERATIONS_V2;
                    salt = bintools$1.cb58Decode(data.salt);
                    pass_hash = data.pass_hash;
                    return [4 /*yield*/, cryptoHelpers._pwcleaner(pass, salt)];
                case 1:
                    checkHash = _a.sent();
                    checkHashString = bintools$1.cb58Encode(checkHash);
                    if (checkHashString !== pass_hash) {
                        throw 'INVALID_PASS';
                    }
                    keys = data.keys;
                    keysDecrypt = [];
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < keys.length)) return [3 /*break*/, 5];
                    key_data = keys[i];
                    key = bintools$1.cb58Decode(key_data.key);
                    nonce = bintools$1.cb58Decode(key_data.iv);
                    return [4 /*yield*/, cryptoHelpers.decrypt(pass, key, salt, nonce)];
                case 3:
                    key_decrypt = _a.sent();
                    key_string = bintools$1.cb58Encode(key_decrypt);
                    keysDecrypt.push({
                        key: key_string,
                    });
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, {
                        version: version,
                        activeIndex: 0,
                        keys: keysDecrypt,
                    }];
            }
        });
    });
}
function readV3(data, pass) {
    return __awaiter(this, void 0, void 0, function () {
        var version, salt, pass_hash, checkHashString, checkHash, keys, keysDecrypt, i, key_data, key, nonce, key_decrypt, key_string;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    version = data.version;
                    cryptoHelpers.keygenIterations = ITERATIONS_V3;
                    salt = bintools$1.cb58Decode(data.salt);
                    pass_hash = data.pass_hash;
                    return [4 /*yield*/, cryptoHelpers.pwhash(pass, salt)];
                case 1:
                    checkHash = _a.sent();
                    checkHashString = bintools$1.cb58Encode(checkHash.hash);
                    if (checkHashString !== pass_hash) {
                        throw 'INVALID_PASS';
                    }
                    keys = data.keys;
                    keysDecrypt = [];
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < keys.length)) return [3 /*break*/, 5];
                    key_data = keys[i];
                    key = bintools$1.cb58Decode(key_data.key);
                    nonce = bintools$1.cb58Decode(key_data.iv);
                    return [4 /*yield*/, cryptoHelpers.decrypt(pass, key, salt, nonce)];
                case 3:
                    key_decrypt = _a.sent();
                    key_string = bintools$1.cb58Encode(key_decrypt);
                    keysDecrypt.push({
                        key: key_string,
                    });
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, {
                        version: version,
                        activeIndex: 0,
                        keys: keysDecrypt,
                    }];
            }
        });
    });
}
function readV4(data, pass) {
    return __awaiter(this, void 0, void 0, function () {
        var version, salt, pass_hash, checkHashString, checkHash, keys, keysDecrypt, i, key_data, key, nonce, key_decrypt, key_string;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    version = data.version;
                    cryptoHelpers.keygenIterations = ITERATIONS_V3;
                    salt = bintools$1.cb58Decode(data.salt);
                    pass_hash = data.pass_hash;
                    return [4 /*yield*/, cryptoHelpers.pwhash(pass, salt)];
                case 1:
                    checkHash = _a.sent();
                    checkHashString = bintools$1.cb58Encode(checkHash.hash);
                    if (checkHashString !== pass_hash) {
                        throw 'INVALID_PASS';
                    }
                    keys = data.keys;
                    keysDecrypt = [];
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < keys.length)) return [3 /*break*/, 5];
                    key_data = keys[i];
                    key = bintools$1.cb58Decode(key_data.key);
                    nonce = bintools$1.cb58Decode(key_data.iv);
                    return [4 /*yield*/, cryptoHelpers.decrypt(pass, key, salt, nonce)];
                case 3:
                    key_decrypt = _a.sent();
                    key_string = bintools$1.cb58Encode(key_decrypt);
                    keysDecrypt.push({
                        key: key_string,
                    });
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, {
                        version: version,
                        activeIndex: 0,
                        keys: keysDecrypt,
                    }];
            }
        });
    });
}
function readV5(data, pass) {
    return __awaiter(this, void 0, void 0, function () {
        var version, salt, pass_hash, checkHashString, checkHash, keys, keysDecrypt, i, key_data, key, nonce, key_decrypt, key_string;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    version = data.version;
                    cryptoHelpers.keygenIterations = ITERATIONS_V3;
                    salt = bintools$1.cb58Decode(data.salt);
                    pass_hash = data.pass_hash;
                    return [4 /*yield*/, cryptoHelpers.pwhash(pass, salt)];
                case 1:
                    checkHash = _a.sent();
                    checkHashString = bintools$1.cb58Encode(checkHash.hash);
                    if (checkHashString !== pass_hash) {
                        throw 'INVALID_PASS';
                    }
                    keys = data.keys;
                    keysDecrypt = [];
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < keys.length)) return [3 /*break*/, 5];
                    key_data = keys[i];
                    key = bintools$1.cb58Decode(key_data.key);
                    nonce = bintools$1.cb58Decode(key_data.iv);
                    return [4 /*yield*/, cryptoHelpers.decrypt(pass, key, salt, nonce)];
                case 3:
                    key_decrypt = _a.sent();
                    key_string = key_decrypt.toString();
                    keysDecrypt.push({
                        key: key_string,
                    });
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, {
                        version: version,
                        activeIndex: 0,
                        keys: keysDecrypt,
                    }];
            }
        });
    });
}
function readV6(data, pass) {
    return __awaiter(this, void 0, void 0, function () {
        var version, activeIndex, salt, keys, keysDecrypt, i, key_data, key, type, nonce, key_decrypt, key_string;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    version = data.version;
                    activeIndex = data.activeIndex;
                    cryptoHelpers.keygenIterations = ITERATIONS_V3;
                    salt = bintools$1.cb58Decode(data.salt);
                    keys = data.keys;
                    keysDecrypt = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < keys.length)) return [3 /*break*/, 7];
                    key_data = keys[i];
                    key = bintools$1.cb58Decode(key_data.key);
                    type = key_data.type;
                    nonce = bintools$1.cb58Decode(key_data.iv);
                    key_decrypt = void 0;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, cryptoHelpers.decrypt(pass, key, salt, nonce)];
                case 3:
                    key_decrypt = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a.sent();
                    throw 'INVALID_PASS';
                case 5:
                    key_string = key_decrypt.toString();
                    keysDecrypt.push({
                        key: key_string,
                        type: type,
                    });
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/, {
                        version: version,
                        activeIndex: activeIndex || 0,
                        keys: keysDecrypt,
                    }];
            }
        });
    });
}
/**
 * Will decrypt and return the keys of the encrypted wallets in the given json file
 * @param data A JSON file of encrypted wallet keys
 * @param pass The password to decrypt the keys
 */
function readKeyFile(data, pass) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = data.version;
                    switch (_a) {
                        case '6.0': return [3 /*break*/, 1];
                        case '5.0': return [3 /*break*/, 3];
                        case '4.0': return [3 /*break*/, 5];
                        case '3.0': return [3 /*break*/, 7];
                        case '2.0': return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 11];
                case 1: return [4 /*yield*/, readV6(data, pass)];
                case 2: return [2 /*return*/, _b.sent()];
                case 3: return [4 /*yield*/, readV5(data, pass)];
                case 4: return [2 /*return*/, _b.sent()];
                case 5: return [4 /*yield*/, readV4(data, pass)];
                case 6: return [2 /*return*/, _b.sent()];
                case 7: return [4 /*yield*/, readV3(data, pass)];
                case 8: return [2 /*return*/, _b.sent()];
                case 9: return [4 /*yield*/, readV2(data, pass)];
                case 10: return [2 /*return*/, _b.sent()];
                case 11: throw 'INVALID_VERSION';
            }
        });
    });
}
function extractKeysV2(file) {
    xChain.getBlockchainAlias();
    var keys = file.keys;
    return keys.map(function (key) {
        // Private keys from the keystore file do not have the PrivateKey- prefix
        var pk = 'PrivateKey-' + key.key;
        // let keypair = keyToKeypair(pk, chainID)
        var keypair = xChain.newKeyChain().importKey(pk);
        var keyBuf = keypair.getPrivateKey();
        var keyHex = keyBuf.toString('hex');
        var paddedKeyHex = keyHex.padStart(64, '0');
        var mnemonic = bip39__namespace.entropyToMnemonic(paddedKeyHex);
        return {
            key: mnemonic,
            type: 'mnemonic',
        };
    });
}
function extractKeysV5(file) {
    return file.keys.map(function (key) { return ({
        key: key.key,
        type: 'mnemonic',
    }); });
}
function extractKeysV6(file) {
    return file.keys.map(function (key) { return ({
        type: key.type,
        key: key.key,
    }); });
}
function extractKeysFromDecryptedFile(file) {
    switch (file.version) {
        case '6.0':
            return extractKeysV6(file);
        case '5.0':
            return extractKeysV5(file);
        case '4.0':
            return extractKeysV2(file);
        case '3.0':
            return extractKeysV2(file);
        case '2.0':
            return extractKeysV2(file);
        default:
            throw 'INVALID_VERSION';
    }
}
/**
 * Given an array of wallets, the active index, and a password, return an encrypted JSON object that is the keystore file
 * @param wallets An array of wallet to encrypt
 * @param pass Password used in encryption
 * @param activeIndex Index of the active wallet in the `wallets` array
 * @return Returns a JSON object that can later be decrypted with `readKeyfile` and the given password
 */
function makeKeyfile(wallets, pass, activeIndex) {
    return __awaiter(this, void 0, void 0, function () {
        var salt, keys, i, wallet, key, type, pk_crypt, key_data, file_data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // 3.0 and above uses 200,000
                    cryptoHelpers.keygenIterations = ITERATIONS_V3;
                    return [4 /*yield*/, cryptoHelpers.makeSalt()];
                case 1:
                    salt = _a.sent();
                    keys = [];
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < wallets.length)) return [3 /*break*/, 5];
                    wallet = wallets[i];
                    key = void 0;
                    type = void 0;
                    if (wallet.type === 'singleton') {
                        key = wallet.key;
                        type = 'singleton';
                    }
                    else {
                        key = wallet.mnemonic;
                        type = 'mnemonic';
                    }
                    return [4 /*yield*/, cryptoHelpers.encrypt(pass, key, salt)];
                case 3:
                    pk_crypt = _a.sent();
                    key_data = {
                        key: bintools$1.cb58Encode(pk_crypt.ciphertext),
                        iv: bintools$1.cb58Encode(pk_crypt.iv),
                        type: type,
                    };
                    keys.push(key_data);
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    file_data = {
                        version: KEYSTORE_VERSION,
                        salt: bintools$1.cb58Encode(salt),
                        activeIndex: activeIndex,
                        keys: keys,
                    };
                    return [2 /*return*/, file_data];
            }
        });
    });
}
var keystore = { readKeyFile: readKeyFile, makeKeyfile: makeKeyfile, KEYSTORE_VERSION: KEYSTORE_VERSION, extractKeysFromDecryptedFile: extractKeysFromDecryptedFile };

Object.defineProperty(exports, 'BN', {
    enumerable: true,
    get: function () {
        return avalanche$1.BN;
    }
});
exports.Assets = Assets;
exports.ERC20 = Erc20;
exports.Keystore = keystore;
exports.LedgerWallet = LedgerWallet;
exports.MnemonicWallet = MnemonicWallet;
exports.Network = index;
exports.NetworkConstants = constants;
exports.SingletonWallet = SingletonWallet;
exports.Utils = utils$1;

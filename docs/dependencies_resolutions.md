# Dependencies Resolutions

## Yarn

### "ansi-styles": "3.2.1"

we have to force ansi-styles to be v3 or else jest will break

```
TypeError: Cannot convert undefined or null to object
    at Function.keys (<anonymous>)
    at Object.<anonymous> (/Users/vagrant/git/node_modules/jest-cli/node_modules/jest-snapshot/node_modules/@babel/highlight/node_modules/chalk/index.js:82:28)
```

### "rxjs": "7.5.6"

in NftFullScreen we have a type error related to rxjs

```
 Type 'import("node_modules/react-native-sensors/node_modules/rxjs/dist/types/internal/Observable").Observable<import("react-native-sensors").OrientationData>' is not assignable to type 'import("node_modules/rxjs/dist/types/internal/Observable").Observable<import("react-native-sensors").OrientationData>'
```

### "eslint": "8.50.0" & "eslint-config-prettier": "8.10.0"

to keep certain eslint plugins/configs from conflicting with each other

### "jest": "29.7.0"

to prevent error when running detox due to different versions of jest conflicting

### "bip174": "2.1.0",

we are using bitcoinjs-lib 5.2.0 and bip174 2.1.1 has type conflicts with it

### "ethers": "6.8.1"

to prevent type conflicts between cubist sdk and ours

### "web3": "1.7.5"

forcing web3 to be 1.7.5 so that we can apply a patch to prevent it
from apply promise polyfill, which breaks our app. React Native already
supports promise out of the box

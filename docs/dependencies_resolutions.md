# Dependencies Resolutions

## Yarn

1/ "ansi-styles": "3.2.1"

We have to force ansi-styles to be v3 or else jest will break

```
TypeError: Cannot convert undefined or null to object
    at Function.keys (<anonymous>)
    at Object.<anonymous> (/Users/vagrant/git/node_modules/jest-cli/node_modules/jest-snapshot/node_modules/@babel/highlight/node_modules/chalk/index.js:82:28)
```


# Token refresh flow

Seedless token has expiration time and Cubist-SDK does the best it can to keep token fresh.
However, for number of reasons token may not refresh and be in stale state which is notified to app
by global event which we catch with

```ts
GlobalEvents.onSessionExpired(onSessionExpiredHandler)
```

Following diagram shows flow of handling various states:

```mermaid
graph TD

ExecuteCubistFn --> isTokenExpired? 
Login --> isTokenExpired? -- yes --> startTokenRefreshFlow
startTokenRefreshFlow -- success --> isWalletInactive? -- yes --> initWallet
startTokenRefreshFlow -- fail --> lockWallet

subgraph startTokenRefreshFlow
	initOidcRegister --> oidcOk?
	savedOidcProvider([savedOidcProvider]) --> oidcOk?
	savedOidcUserId([savedOidcUserId]) --> oidcOk?
	oidcOk? -- yes --> Cubist.register
	oidcOk? -- wrongEmail --> showWarn --> retry
	oidcOk? -- somethingElse --> fail
	Cubist.register --> whichMFA?
    whichMFA? -- TOTP --> verifyTOTP
	verifyTOTP --> totpOK? -- yes --> success
	totpOK? -- no --> verifyTOTP
	totpOK? -- user canceled --> fail
    whichMFA? -- none --> success
    whichMFA? -- FIDO --> approveFido --> approved?
    approved? -- yes --> success
    approved? -- no --> fail
end
```
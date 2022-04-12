import {
  asyncScheduler,
  AsyncSubject,
  concat,
  from,
  Observable,
  of,
  zip
} from 'rxjs'
import {concatMap, map} from 'rxjs/operators'
import {Keystore} from '@avalabs/avalanche-wallet-sdk'
import DocumentPicker from 'react-native-document-picker'
import * as RNFS from 'react-native-fs'
import {
  AccessWalletMultipleInput,
  AllKeyFileDecryptedTypes
} from '@avalabs/avalanche-wallet-sdk/dist/Keystore/types'

export default class {
  onDocumentPick = (): Observable<DocPickEvents> => {
    const passwordPrompt = new AsyncSubject<string>()

    return from(
      DocumentPicker.pick({type: [DocumentPicker.types.allFiles]})
    ).pipe(
      concatMap(file => RNFS.readFile(file.uri)),
      concatMap((fileContent: string) => {
        const json = JSON.parse(fileContent)
        return concat(
          of(new PasswordPrompt(passwordPrompt)),
          this.extractMnemonicFromJson(json, passwordPrompt),
          asyncScheduler
        )
      })
    )
  }

  private extractMnemonicFromJson = (
    json: any,
    passwordPrompt: AsyncSubject<string>
  ): Observable<Finished> => {
    return zip(of(json), passwordPrompt).pipe(
      concatMap((value: [any, string]) => {
        const json = value[0]
        const password = value[1]
        return Keystore.readKeyFile(json, password)
      }),
      map((keyfile: AllKeyFileDecryptedTypes) => {
        const keys: AccessWalletMultipleInput[] =
          Keystore.extractKeysFromDecryptedFile(keyfile)
        const mnemonicKeyphrase = keys[0].key
        return new Finished(mnemonicKeyphrase)
      })
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocPickEvents {}

export class PasswordPrompt implements DocPickEvents {
  prompt: AsyncSubject<string>

  constructor(prompt: AsyncSubject<string>) {
    this.prompt = prompt
  }
}

export class Finished implements DocPickEvents {
  mnemonic: string

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic
  }
}

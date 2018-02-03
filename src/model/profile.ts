import { Account } from '../model/account';

export class Profile {
  name: string;
  selected: boolean;
  settings: {};

  tokenDirectories: Array<string>;
  accounts: Array<Account>;
  encryptedMnemonic: any;
  mnemonicIsBackup: boolean;
  encryptedPassphrase: any;
  derivationUsed: number;
  encryptedWallet: any;
}

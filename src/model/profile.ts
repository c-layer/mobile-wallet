import { Account } from '../model/account';

export class Profile {
  name: string;
  selected: boolean;
  settings: {  };
  networks: Array<any>;

  contracts: {  };

  accounts: Array<Account>;
  encryptedMnemonic: any;
  mnemonicIsBackup: boolean;
  encryptedPassphrase: any;
  derivationUsed: number;
  encryptedWallet: any;
}

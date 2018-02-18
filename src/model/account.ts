import { AccountToken } from "./account-token";

export enum AccountType {
  PUBLIC, MULTISIG, COLD, HOT
}

export class Account { 
  static PRIVATE_KEY_LENGTH:number = 66;
  static PUBLIC_KEY_LENGTH:number = 42;

  name: string;
  address: string;
  type: AccountType;
  active: boolean;
  walletId: number;

  derivationId: number;

  portfolio: { [id : string] : AccountToken[] };

  constructor(name: string, type: AccountType, address: string) {
    this.name = name;
    this.address = address;
    this.type = type;
    this.portfolio = {};
  }
  
  public static publicAccount(name: string, address: string) : Account {
    return new Account(name, AccountType.PUBLIC, address);
  }

  public static hotAccount(name: string, address: string) : Account {
    return new Account(name, AccountType.HOT, address);
  }

  static coldAccount() {
    // Pkey is stored but encrypted with a strong mecanism
    // Require a 2FA
    throw "Not yet implemented !";
  }

  static multisigAccount() {
    // Contract address is needed
    // GUI must shows unlocking status progression
    throw "Not yet implemented !";
  }
}
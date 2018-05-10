declare function require(moduleName: string): any;
const Registry = require('../assets/contracts/Registry.json');
const ERC20 = require('../assets/contracts/ERC20.json');
const DemoToken = require('../assets/contracts/DemoToken.json');
const KYC = require('../assets/contracts/KnowYourCustomer.json');
const DemoVoting = require('../assets/contracts/DemoVoting.json');
const DemoShare = require('../assets/contracts/DemoShare.json');

export class Contract {
  name: string;
  address: string;
  image: string;
  share: {
    dividendAmount: number;
    dividendSymbol: number;
    dividendToken: string;
    totalShare: number;
  };
  vote: {
    voteToken: string;
    voteTokenTotalSupply: number;
    voteTokenOwned: number;
    voteTokenSymbol: string;
    voteTokenName: string;
    proposalId: number;
    url: string;
    hash: string;
    startedAt: number;
    closedAt: number;
    hasVoted: number;
    approvals: number;
    rejections: number;
  }
}

export class ContractType {
  erc20: boolean;
  kyc: boolean;
  share: boolean;
  vote: boolean;
  pausable: boolean;

  constructor(erc20: boolean, kyc: boolean, share: boolean, vote: boolean, pausable: boolean) {
    this.erc20 = erc20;
    this.kyc = kyc;
    this.share = share;
    this.vote = vote;
    this.pausable = pausable;
  }

  static demoFiatToken = new ContractType(true, true, false, false, true);
  static demoToken = new ContractType(true, true, false, false, true);
  static demoShare = new ContractType(false, false, true, true, false);

  static types = [
    ContractType.demoFiatToken,
    ContractType.demoToken,
    ContractType.demoShare
  ];

  public static getContractType(id: number): ContractType {
    return ContractType.types[id];
  }

  public static getId(type: ContractType): number {
    return ContractType.types.indexOf(type);
  }

  public static getRegistry() {
    return Registry;
  }

  public static getERC20() {
    return ERC20;
  }

  public static getDemoToken() {
    return DemoToken;
  }

  public static getKYC() {
    return KYC;
  }

  public static getDemoVoting() {
    return DemoVoting;
  }

  public static getDemoShare() {
    return DemoShare;
  }
}
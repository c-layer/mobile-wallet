import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AccountProvider } from '../../../providers/account';
import { Account } from '../../../model/account';
import { Contract } from '../../../model/contract';
import { FormatProvider } from '../../../providers/format';
import { WalletSecurePage, WalletSecureMode } from '../../wallet/wallet-secure/wallet-secure';
import { ContractProvider } from '../../../providers/contract';

@Component({
  selector: 'page-voting',
  templateUrl: 'voting.html',
})
export class VotingPage {
  activeAccount: Account = null;
  supply: number = null;

  contract: Contract;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public formatProvider: FormatProvider,
    private contractProvider: ContractProvider,
    private accountProvider: AccountProvider) {
  }

  canVote() {
    return this.voteIsPending() && !this.contract.vote.hasVoted;
  }

  noTokenOwned() {
    return this.voteExist() && this.contract.vote.voteTokenOwned == 0;
  }

  hasAlreadyVoted() {
    return this.voteIsPending() && this.contract.vote.hasVoted;
  }

  voteIsPending() {
    return this.voteExist() && !this.isClosed();
  }

  voteIsClosed() {
    return this.voteExist() && this.isClosed();
  }

  voteExist() {
    return this.contract && this.contract.vote && this.contract.vote.startedAt > 0;
  }

  isClosedAtDefined() {
    return (this.contract.vote.closedAt < Number.MAX_SAFE_INTEGER);
  }

  isClosed() {
    return this.contract.vote.closedAt < new Date().getTime();
  }

  getContractName() {
    return (this.contract) ? this.contract.name : undefined; 
  }

  getVoteResult(value) {
    return Math.round(value / this.contract.vote.voteTokenTotalSupply * 1000) / 10 + '%';
  }

  vote(approve: true) {
    this.navCtrl.parent.parent.push(WalletSecurePage, {
      mode: WalletSecureMode.ELEVATE_PRIVS,
      callback: (password) => {
        this.navCtrl.pop();
        return this.contractProvider.vote(this.contract, approve, password);
      }
    });
  }

  ionViewWillEnter() {
    this.activeAccount = this.accountProvider.getActiveAccount();

    this.contract = this.navParams.get('contract');
    console.log(this.contract);
  }

  ionViewDidLeave() {
    this.navCtrl.popToRoot();
  }
}

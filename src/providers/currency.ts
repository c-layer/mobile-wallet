declare function require(moduleName: string): any;
const MtPelerinTokens = require('../assets/contracts/MtPelerinTokens.json');
const FiatToken = require('../assets/contracts/FiatToken.json');

import { Injectable } from '@angular/core';
import { Web3Provider } from './web3';
import { Account } from '../model/account';
import { Currency } from '../model/currency';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
import { ProfileProvider } from './profile';
import { AccountProvider } from './account';
import { AccountToken } from '../model/account-token';

@Injectable()
export class CurrencyProvider {
  public currencies: Currency[] = [];

  constructor(private web3Provider: Web3Provider,
    private profileProvider: ProfileProvider,
    private accountProvider: AccountProvider) {
  }

  public getCurrencyById(id: number): Currency {
    if (this.currencies && this.currencies.length > id) {
      return this.currencies[id];
    }
    return null;
  }

  public getCurrencyBySymbol(symbol: string): Currency {
    let found = null;
    if (this.currencies) {
      this.currencies.forEach(currency => {
        if (currency.symbol == symbol) {
          found = currency;
        }
      });
    }
    return found;
  }

  public portfolioObs(account: Account): Observable<AccountToken[]> {
    if (!account || !account.address) {
      return Observable.of([]);
    }

    return this.allCurrenciesObs().flatMap(currencies => {
      if (currencies.length == 0) return Observable.of([]);
      return Observable.forkJoin(currencies.map(currency => {

        let blockNumber = this.web3Provider.getLatestBlockNumber();
        if (currency.contract == null) {
          return currency.balanceOf(account).map((balance) =>
            <AccountToken>{
              currency: currency.symbol,
              image: currency.image,
              name: currency.name,
              balance: balance,
              untilBlock: blockNumber,
              transactions: []
            }
          );
        }
        return currency.balanceOf(account).map(balance => {
          let transactions = [];
          currency.contract.events.Transfer({
            fromBlock: 0,
            toBlock: blockNumber,
            topics: [null, this.web3Provider.encodeAddress(account.address), null]
          }).subscribe((error, data) => {
            if (data) {
              transactions.push(data);
            }
          });
          currency.contract.events.Transfer({
            fromBlock: 0,
            toBlock: blockNumber,
            topics: [null, null, this.web3Provider.encodeAddress(account.address)]
          }).subscribe((error, data) => {
            if (data) {
              transactions.push(data);
            }
          });
          return <AccountToken>{
            currency: currency.symbol,
            image: currency.image,
            name: currency.name,
            balance: balance,
            untilBlock: blockNumber,
            transactions: transactions
          };
        });
      })
      )
    });
  }

  public allCurrenciesObs(): Observable<Array<Currency>> {

    return this.web3Provider.whenReady().flatMap(() => {
      let web3Provider = this.web3Provider;
      let accountProvider = this.accountProvider;
      let profile = this.profileProvider.getProfile();
      let ether: Promise<Currency> = Promise.resolve({
        name: 'Ethereum', decimal: null,
        address: null, contract: null, supply: null, symbol: 'ETH',
        image: 'assets/imgs/currencies/ETHER.svg',
        balanceOf: (account: Account) => Observable.fromPromise(Promise.resolve(account)
          .then(account => web3Provider.getBalance(account.address)
            .then(balance => web3Provider.getUtils().fromWei(balance, 'ether')))),
        transfer: function (sender: Account, password: string, beneficiaryAddress: string, amount: number) {
          let value = web3Provider.getUtils().toWei(amount, 'ether');
          let result = accountProvider.getPrivateKey(sender, password).flatMap(privateKey =>
            web3Provider.sendSignedTransaction(
              sender.address, privateKey, beneficiaryAddress, value, null));
          let eth = sender.portfolio[0];
          eth.transactions.push({
            returnValues: {
              value: value, from: sender.address, to: beneficiaryAddress
            }
          });
          return result;
        }
      });

      let directoryPromise: Promise<Currency[]> = Promise.resolve([]);
      if (profile && profile.tokenDirectories && profile.tokenDirectories.length > 0) {
        let tokenDirectory = web3Provider.getContract(MtPelerinTokens.abi, profile.tokenDirectories[0]);
        if (tokenDirectory) {
          directoryPromise = tokenDirectory.methods.getCurrencyCount().call().then(count => {
            let directoryTokens = [ether];
            for (var i = 1; i <= count; i++) {
              let token: Promise<Currency> = tokenDirectory.methods.getCurrencyById(i).call().then(address => {
                let contract = web3Provider.getContract(FiatToken.abi, address);
                if (contract) {
                  let methods = contract.methods;
                  return Promise.all([
                    methods.name().call(),
                    methods.symbol().call()
                      .then(symbol => web3Provider.getUtils().toAscii(symbol)),
                    methods.totalSupply().call(),
                  ]).then(details => <Currency>{
                    name: details[0],
                    decimal: 2,
                    address: address,
                    contract: contract,
                    supply: details[2],
                    symbol: details[1],
                    image: 'assets/imgs/currencies/MTPELERIN.svg',
                    balanceOf: (account: Account) =>
                      Observable.fromPromise(Promise.resolve(account)
                        .then(account => contract.methods.balanceOf(account.address).call())
                        .then((balance: number) => (balance) ? balance / 100 : 0)),
                    transfer: function (sender: Account, password: string, beneficiaryAddress: string, amount: number) {
                      console.log(amount + ' ' + this.symbol + ' to ' + beneficiaryAddress);
                      let cents = amount * (10 ** this.decimal);
                      let contractData = methods.transfer(beneficiaryAddress, cents).encodeABI();
                      return accountProvider.getPrivateKey(sender, password).flatMap(privateKey =>
                        web3Provider.sendSignedTransaction(
                          sender.address, privateKey, address, null, contractData));
                    }
                  });
                } else {
                  return null;
                }
              });
              directoryTokens.push(token);
            }
            return Promise.all(directoryTokens).then(currencies => {
              this.currencies = currencies.filter(currency => (currency != null));
              return currencies;
            });
          });
        };
      };

      return Observable.fromPromise(
        directoryPromise
      );
    });
  }
}
